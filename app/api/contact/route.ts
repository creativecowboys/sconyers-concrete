import { Resend } from 'resend'
import { site } from '@/lib/site'
import { createGhlOpportunity } from '@/lib/ghl'
import { pitchNote, pitchSubjectPrefix, screenPitch } from '@/lib/pitch'
import { parseFailedCount } from '@/lib/plans'
import { resolveAttachments, type PlanAttachment } from '@/lib/plans-server'

/** Field name -> label, in the order they should appear in the email. */
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  'first-name': 'First name',
  'last-name': 'Last name',
  company: 'Company',
  phone: 'Phone',
  email: 'Email',
  service: 'Service needed',
  timeline: 'Timeline',
  location: 'Project city / ZIP',
  'project-address': 'Project location',
  message: 'Project details',
  utm_campaign: 'Ad campaign',
  utm_term: 'Search keyword',
  utm_source: 'Traffic source',
  gclid: 'Google Ads click ID',
}

const FIELD_ORDER = [
  'name',
  'first-name',
  'last-name',
  'company',
  'phone',
  'email',
  'service',
  'timeline',
  'location',
  'project-address',
  'message',
  'utm_campaign',
  'utm_term',
  'utm_source',
  'gclid',
]

// Who gets each lead: Chip (estimating) and Brice (sales — new business goes to him, Dave Nov 15
// 2026). CONTACT_TO_EMAIL (comma-separated) replaces this list when set.
const TO_EMAILS = (process.env.CONTACT_TO_EMAIL ?? `${site.email},brice.wiley@sconyersconcrete.com`)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
// Optional silent copy of every lead (comma-separated). Set CONTACT_BCC_EMAIL in Vercel
// Production to copy Creative Cowboys (howdy@creativecowboys.co, Dave Nov 15 2026) so we can
// see leads too. Unset = no copy. Howdy's inbox routine files these copies and never replies:
// the Reply-To is the lead, so a reply would land in the prospect's inbox.
const BCC_EMAILS = (process.env.CONTACT_BCC_EMAIL ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
// Must be @send.sconyersconcrete.com — that subdomain is what's verified in
// Resend (DKIM + SPF + MX), NOT the root domain. Sending from the root would be
// rejected. Verified 2026-07-28.
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ??
  'Sconyers Concrete Website <noreply@send.sconyersconcrete.com>'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Honeypot: bots fill every field they find.
  if (typeof body.company_website === 'string' && body.company_website.trim()) {
    return Response.json({ ok: true })
  }

  const get = (key: string) =>
    typeof body[key] === 'string' ? (body[key] as string).trim() : ''

  const email = get('email')
  const name = [get('name'), get('first-name'), get('last-name')]
    .filter(Boolean)
    .join(' ')
    .trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400 })
  }
  if (!name) {
    return Response.json({ error: 'Your name is required.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set — cannot send lead email.')
    return Response.json(
      { error: `Our form is temporarily offline. Please call ${site.phone}.` },
      { status: 500 }
    )
  }

  const source = get('source') || 'website'
  const rows = FIELD_ORDER.filter((key) => get(key)).map((key) => ({
    label: FIELD_LABELS[key],
    value: get(key),
  }))

  // Vendor pitches (SEO, web, marketing, loans) skip GoHighLevel and arrive
  // with "[Filtered: pitch]" in the subject. This site keeps no other copy of
  // a submission, so a pitch is still emailed: a false positive is never lost.
  const pitch = screenPitch([get('company'), get('message')], { profile: 'default' })
  const note = pitchNote(pitch)
  if (pitch.verdict !== 'clean') {
    console.warn(`[contact] pitch screen: ${pitch.verdict} (${pitch.reasons.join('; ')})`)
  }

  // Optional plan files (see lib/plans.ts). They were uploaded straight to the
  // private Blob store; here they are checked and turned into signed links. A
  // file that cannot be found is left out and the lead still goes out.
  const plans: { files: PlanAttachment[]; missing: number } =
    body.attachments === undefined && body.attachmentsFailed === undefined
      ? { files: [], missing: 0 }
      : await resolveAttachments(
          body.attachments,
          process.env.VERCEL_ENV === 'production' ? site.url : new URL(request.url).origin
        )
  const plansMissing = plans.missing + parseFailedCount(body.attachmentsFailed)
  const plansMissingLine = plansMissing
    ? `${plansMissing} more file${plansMissing === 1 ? '' : 's'} the sender tried to attach did not upload. Ask them to email the plans.`
    : ''

  const text = [
    ...(note ? [note, ''] : []),
    `New estimate request from the ${source} page.`,
    '',
    ...rows.map((row) => `${row.label}: ${row.value}`),
    ...(plans.files.length
      ? [
          '',
          `Plans attached (${plans.files.length}):`,
          ...plans.files.map(
            (file) => `- ${file.name} (${file.sizeLabel})${file.url ? `: ${file.url}` : ''}`
          ),
        ]
      : []),
    ...(plansMissingLine ? ['', plansMissingLine] : []),
  ].join('\n')

  const html = `
    <h2 style="font-family:Arial,sans-serif;">New estimate request</h2>${
      note
        ? `\n    <p style="font-family:Arial,sans-serif;background:#fef3c7;border:1px solid #f59e0b;color:#78350f;padding:10px 12px;">${escapeHtml(note)}</p>`
        : ''
    }
    <p style="font-family:Arial,sans-serif;color:#555;">
      Submitted from the <strong>${escapeHtml(source)}</strong> page.
    </p>
    <table style="font-family:Arial,sans-serif;border-collapse:collapse;">
      ${rows
        .map(
          (row) => `<tr>
        <td style="padding:6px 12px 6px 0;vertical-align:top;color:#888;">${escapeHtml(row.label)}</td>
        <td style="padding:6px 0;vertical-align:top;">${escapeHtml(row.value).replace(/\n/g, '<br>')}</td>
      </tr>`
        )
        .join('')}
    </table>${
      plans.files.length
        ? `
    <h3 style="font-family:Arial,sans-serif;margin:20px 0 6px;">Plans attached (${plans.files.length})</h3>
    <ul style="font-family:Arial,sans-serif;margin:0;padding-left:20px;">
      ${plans.files
        .map(
          (file) => `<li style="margin:4px 0;">${
            file.url
              ? `<a href="${escapeHtml(file.url)}">${escapeHtml(file.name)}</a>`
              : escapeHtml(file.name)
          } <span style="color:#888;">(${escapeHtml(file.sizeLabel)})</span></li>`
        )
        .join('')}
    </ul>
    <p style="font-family:Arial,sans-serif;color:#888;font-size:12px;">Links open the file from the website. Please don't forward them outside the company.</p>`
        : ''
    }${
      plansMissingLine
        ? `
    <p style="font-family:Arial,sans-serif;background:#fef3c7;border:1px solid #f59e0b;color:#78350f;padding:10px 12px;">${escapeHtml(plansMissingLine)}</p>`
        : ''
    }
  `

  try {
    // 1. Create the opportunity first — GHL is the system of record for leads.
    //    Non-fatal by design: if it fails we still fall through to the email, so
    //    a GHL outage costs a pipeline entry rather than the whole lead.
    //    A filtered pitch is never added to GHL.
    const ghl =
      pitch.verdict === 'pitch'
        ? ({ success: true, skipped: 'pitch' } as const)
        : await createGhlOpportunity({
            name,
            email,
            phone: get('phone'),
            company: get('company'),
            location: get('location'),
            service: get('service'),
            timeline: get('timeline'),
            message: get('message'),
            source,
            ...(plans.files.length ? { plans: plans.files } : {}),
            ad: {
              gclid: get('gclid') || get('gbraid') || get('wbraid'),
              source: get('utm_source'),
              medium: get('utm_medium'),
              campaign: get('utm_campaign'),
              term: get('utm_term'),
            },
          })
    if (!ghl.success && ghl.error !== 'not_configured') {
      console.error('[contact] GHL sync failed; still sending lead email:', ghl.error)
    }

    // 2. Then notify Chip. This always runs, whatever happened above.
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAILS,
      replyTo: email,
      ...(BCC_EMAILS.length ? { bcc: BCC_EMAILS } : {}),
      subject: `${pitchSubjectPrefix(pitch)}New estimate request — ${name} (${source})${
        plans.files.length ? ' — plans attached' : ''
      }`,
      text,
      html,
      headers: { 'X-Website-Lead': 'sconyersconcrete.com' },
    })

    if (error) {
      console.error('[contact] Resend rejected the message:', error)
      return Response.json(
        { error: `We couldn't send your message. Please call ${site.phone}.` },
        { status: 502 }
      )
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[contact] Unexpected failure sending lead email:', err)
    return Response.json(
      { error: `We couldn't send your message. Please call ${site.phone}.` },
      { status: 500 }
    )
  }
}
