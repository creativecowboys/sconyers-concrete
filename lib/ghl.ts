/**
 * GoHighLevel (LeadConnector) integration.
 *
 * When the website form is submitted we:
 *   1. Upsert the contact in the Sconyers GHL sub-account (dedupes by email/phone)
 *   2. Create an opportunity in the configured pipeline/stage
 *      (GHL refuses a second open opportunity for the same contact — we treat
 *      that as success and reuse the existing one)
 *   3. Attach the full lead detail as a contact note (best effort)
 *
 * Ported from the Met Lane Law integration, which is the reference
 * implementation for this pattern across Creative Cowboys sites.
 *
 * Required env vars (set in .env.local locally and in Vercel project settings):
 *   GHL_API_TOKEN         - Private Integration token (Settings > Private Integrations)
 *   GHL_LOCATION_ID       - Sconyers sub-account location ID
 *   GHL_PIPELINE_ID       - Optional. Pipeline to create opportunities in
 *   GHL_PIPELINE_STAGE_ID - Optional. Stage new opportunities land in
 *
 * GHL's screens never show stage ids, so when the pipeline/stage ids are not set
 * the pipeline is found by name (GHL_PIPELINE_NAME, default "Website Leads") and
 * the stage by name (GHL_PIPELINE_STAGE_NAME, default "New Lead", else the first
 * stage) through GET /opportunities/pipelines — the token needs the
 * opportunities.readonly scope for that. Sconyers' sub-account is
 * 1QYHjVGqFxCJC8XvAopP and its "Website Leads" pipeline is CbQGLYfkjWks1pR5bbKT
 * (New Lead / Contacted / Estimate Sent / Closed), checked Nov 15, 2026.
 *
 * Until the token and location are set this module no-ops and returns
 * { success: false, error: 'not_configured' } — the form keeps working and
 * email keeps sending.
 *
 * NOTE: unlike Met Lane, this does not write contact custom fields. Custom field
 * ids are per-sub-account and must be referenced by id (the v2 /contacts/upsert
 * endpoint silently drops key-based entries, returning 200 with an empty field).
 * Everything lands in the note instead, which needs no field configuration. If
 * Sconyers later wants structured fields, look ids up with
 * GET /locations/{locationId}/customFields and add them here.
 */

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

export interface GhlLead {
  name?: string
  email?: string
  phone?: string
  company?: string
  /** Project city / ZIP from the form. */
  location?: string
  /** Which service they picked (Slabs, Paving, ADA Ramps, ...). */
  service?: string
  /** Estimated start (ASAP, 1-3 Months, ...). */
  timeline?: string
  message?: string
  /** Which page the form was submitted from, e.g. "commercial-concrete-slabs-newnan-ga". */
  source?: string
  /** Plan files the sender attached (see lib/plans.ts): listed in the note with their links. */
  plans?: { name: string; sizeLabel: string; url: string | null }[]
  /** The ad click that brought them, when there was one (see lib/attribution.ts). */
  ad?: {
    gclid?: string
    source?: string
    medium?: string
    campaign?: string
    term?: string
  }
}

function isPaidGoogle(ad: GhlLead['ad']): boolean {
  if (!ad) return false
  return Boolean(ad.gclid || (ad.source === 'google' && ad.medium === 'cpc'))
}

interface GhlResponse {
  ok: boolean
  status: number
  json: any
}

async function ghlFetch(
  path: string,
  token: string,
  body: Record<string, unknown>
): Promise<GhlResponse> {
  const res = await fetch(`${GHL_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_API_VERSION,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, json }
}

const PIPELINE_NAME = process.env.GHL_PIPELINE_NAME ?? 'Website Leads'
const STAGE_NAME = process.env.GHL_PIPELINE_STAGE_NAME ?? 'New Lead'
const norm = (s: unknown) => String(s ?? '').trim().toLowerCase()

type Target = { pipelineId: string; pipelineStageId: string }
let cachedTarget: Target | null = null

/** The pipeline + stage a new lead goes into: env ids when set, otherwise looked up by name. */
async function resolveTarget(token: string, locationId: string): Promise<Target> {
  const pipelineId = process.env.GHL_PIPELINE_ID
  const pipelineStageId = process.env.GHL_PIPELINE_STAGE_ID
  if (pipelineId && pipelineStageId) return { pipelineId, pipelineStageId }
  if (cachedTarget) return cachedTarget

  const res = await fetch(
    `${GHL_API_BASE}/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: GHL_API_VERSION,
        Accept: 'application/json',
      },
    }
  )
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`GHL pipelines lookup failed (${res.status}): ${JSON.stringify(json)}`)
  }
  const pipelines: { id: string; name?: string; stages?: { id: string; name?: string }[] }[] =
    json?.pipelines ?? []
  const pipe =
    pipelines.find((p) => pipelineId && p.id === pipelineId) ??
    pipelines.find((p) => norm(p.name) === norm(PIPELINE_NAME))
  if (!pipe) throw new Error(`GHL pipeline "${pipelineId ?? PIPELINE_NAME}" not found`)
  const stages = pipe.stages ?? []
  const stage =
    stages.find((s) => pipelineStageId && s.id === pipelineStageId) ??
    stages.find((s) => norm(s.name) === norm(STAGE_NAME)) ??
    stages[0]
  if (!stage) throw new Error(`GHL pipeline "${pipe.name}" has no stages`)
  cachedTarget = { pipelineId: pipe.id, pipelineStageId: stage.id }
  return cachedTarget
}

/**
 * Creates (or reuses) a GHL opportunity from a website lead.
 * Never throws — a GHL outage must not break form email delivery.
 */
export async function createGhlOpportunity(
  lead: GhlLead
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  try {
    const token = process.env.GHL_API_TOKEN
    const locationId = process.env.GHL_LOCATION_ID

    if (!token || !locationId) {
      // Expected until GHL is configured — debug, not error, so it doesn't
      // cry wolf in the Vercel logs on every submission.
      console.debug('[ghl] not configured; skipping opportunity creation')
      return { success: false, error: 'not_configured' }
    }

    if (!lead.email && !lead.phone) {
      return { success: false, error: 'no_email_or_phone' }
    }

    const fullName = (lead.name || '').trim()
    const [firstName, ...rest] = fullName.split(/\s+/)
    const lastName = rest.join(' ')

    // 1. Upsert contact (dedupes on email/phone)
    const upsert = await ghlFetch('/contacts/upsert', token, {
      locationId,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(lead.email ? { email: lead.email } : {}),
      ...(lead.phone ? { phone: lead.phone } : {}),
      ...(lead.company ? { companyName: lead.company } : {}),
      source: 'Website - Estimate Request',
      tags: [
        'website-lead',
        ...(isPaidGoogle(lead.ad) ? ['google-ads'] : []),
        ...(lead.service ? [`service:${lead.service.toLowerCase()}`] : []),
      ],
    })
    const contactId: string | undefined = upsert.json?.contact?.id
    if (!upsert.ok || !contactId) {
      throw new Error(
        `GHL upsert failed (${upsert.status}): ${JSON.stringify(upsert.json)}`
      )
    }

    // 2. Create the opportunity. Name it so it's scannable in the pipeline —
    //    these are B2B leads, so company reads better than person where present.
    const oppName = [lead.company || fullName || lead.email, lead.service]
      .filter(Boolean)
      .join(' — ')

    let opportunityId: string | undefined
    const { pipelineId, pipelineStageId } = await resolveTarget(token, locationId)
    const opp = await ghlFetch('/opportunities/', token, {
      locationId,
      pipelineId,
      pipelineStageId,
      contactId,
      name: oppName,
      status: 'open',
      source: lead.source
        ? `sconyersconcrete.com/${lead.source}`
        : 'sconyersconcrete.com',
    })
    if (opp.ok) {
      opportunityId = opp.json?.opportunity?.id
    } else if (opp.status === 400 && opp.json?.meta?.existingId) {
      // Contact already has an open opportunity — reuse it.
      opportunityId = opp.json.meta.existingId
    } else {
      throw new Error(
        `GHL opportunity create failed (${opp.status}): ${JSON.stringify(opp.json)}`
      )
    }

    // 3. Attach the full submission as a note (best effort). Notes accumulate,
    //    so repeat submissions keep their history.
    const noteLines = [
      `Website estimate request${lead.source ? ` (${lead.source})` : ''}`,
      '',
      ...(lead.company ? [`Company: ${lead.company}`] : []),
      ...(lead.location ? [`Project city / ZIP: ${lead.location}`] : []),
      ...(lead.service ? [`Service: ${lead.service}`] : []),
      ...(lead.timeline ? [`Timeline: ${lead.timeline}`] : []),
      ...(lead.message ? ['', 'Project details:', lead.message] : []),
      ...(lead.plans?.length
        ? [
            '',
            `Plans attached (${lead.plans.length}):`,
            ...lead.plans.map(
              (file) => `- ${file.name} (${file.sizeLabel})${file.url ? `: ${file.url}` : ''}`
            ),
          ]
        : []),
      ...(isPaidGoogle(lead.ad)
        ? [
            '',
            'From a Google ad:',
            ...(lead.ad?.campaign ? [`Campaign: ${lead.ad.campaign}`] : []),
            ...(lead.ad?.term ? [`Search keyword: ${lead.ad.term}`] : []),
            ...(lead.ad?.gclid ? [`Click ID: ${lead.ad.gclid}`] : []),
          ]
        : []),
    ]
    const note = await ghlFetch(`/contacts/${contactId}/notes`, token, {
      body: noteLines.join('\n'),
    })
    if (!note.ok) {
      console.error('[ghl] note creation failed (non-fatal):', note.status, note.json)
    }

    return { success: true, opportunityId }
  } catch (error) {
    console.error('[ghl] opportunity creation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'unknown',
    }
  }
}
