'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOffice } from '@/lib/admin/auth'
import {
  MAX_SCHEDULED_DAYS,
  crewEventRows,
  scheduleChanged,
  weekdayDates,
  type ScheduleKey,
} from '@/lib/admin/crew-schedule'
import { todayInGeorgia } from '@/lib/admin/format'
import { dollarsToCents, parsePercent } from '@/lib/admin/money'
import { JOB_STATUSES, JOB_TYPES, type JobStatus, type JobType } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'

type Supabase = Awaited<ReturnType<typeof createClient>>

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function nullable(formData: FormData, key: string) {
  return text(formData, key) || null
}

function status(formData: FormData): JobStatus {
  const value = text(formData, 'status')
  return (JOB_STATUSES as readonly string[]).includes(value)
    ? (value as JobStatus)
    : 'active'
}

function jobType(formData: FormData): JobType {
  const value = text(formData, 'job_type')
  return (JOB_TYPES as readonly string[]).includes(value) ? (value as JobType) : 'day_rate'
}

/** A whole non-negative number, or null. "12.5 days" is not a bid. */
function wholeNumber(formData: FormData, key: string) {
  const value = text(formData, key)
  return /^\d+$/.test(value) ? Number(value) : null
}

function payload(formData: FormData) {
  // Only the chosen type's numbers are kept; the other type's columns go back
  // to null so a job switched from 80/20 to day rate does not carry a ghost
  // contract into the home widget.
  const type = jobType(formData)
  const dayRate = type === 'day_rate'
  return {
    name: text(formData, 'name'),
    client_name: nullable(formData, 'client_name'),
    address: nullable(formData, 'address'),
    city: nullable(formData, 'city'),
    county: nullable(formData, 'county'),
    status: status(formData),
    start_date: nullable(formData, 'start_date'),
    end_date: nullable(formData, 'end_date'),
    crew_id: nullable(formData, 'crew_id'),
    notes: nullable(formData, 'notes'),
    job_type: type,
    day_rate_cents: dayRate ? dollarsToCents(text(formData, 'day_rate')) : null,
    days_bid: dayRate ? wholeNumber(formData, 'days_bid') : null,
    contract_cents: dayRate ? null : dollarsToCents(text(formData, 'contract')),
    crew_share_pct: dayRate ? 80 : (parsePercent(text(formData, 'crew_share_pct')) ?? 80),
  }
}

type SavedJob = ReturnType<typeof payload> & { id: string }

/**
 * What the job detail page says about the schedule after a save. Carried in
 * the redirect so the server action stays stateless.
 *   scheduled=<n>       n weekday rows written for the crew
 *   schedule=failed     the job saved but the crew_events write did not
 *   schedule=too-long   the span is over MAX_SCHEDULED_DAYS, nothing written
 */
type ScheduleOutcome = { scheduled: number } | { schedule: 'failed' | 'too-long' } | null

/**
 * Keeps this job's generated crew_events in step with crew / start / finish.
 *
 * Create: one row per weekday from start through finish, past days included —
 * a job entered a week late still gets its history.
 * Edit: only when crew, start or finish changed. Delete THIS job's rows dated
 * today or later, then regenerate from max(start, today) through finish. Past
 * rows are never touched: they are the days-on-site history the home widget
 * is built on. Clearing the crew is the same path with nothing to regenerate.
 *
 * Only rows with job_id = this job are ever deleted. That does include an
 * entry the office typed on the Crews page and tied to this job, if it is
 * dated today or later — flagged in the PR for Dave.
 */
async function syncCrewSchedule(
  supabase: Supabase,
  job: SavedJob,
  createdBy: string,
  previous: ScheduleKey | null
): Promise<ScheduleOutcome> {
  const today = todayInGeorgia()

  if (previous) {
    if (!scheduleChanged(previous, job)) return null
    const { error } = await supabase
      .from('crew_events')
      .delete()
      .eq('job_id', job.id)
      .gte('starts_on', today)
    if (error) {
      console.error('[admin/jobs] schedule clear failed:', error.message)
      return { schedule: 'failed' }
    }
  }

  if (!job.crew_id || !job.start_date || !job.end_date) return null

  const dates = weekdayDates(job.start_date, job.end_date, previous ? today : undefined)
  if (dates.length === 0) return { scheduled: 0 }
  if (dates.length > MAX_SCHEDULED_DAYS) return { schedule: 'too-long' }

  const rows = crewEventRows({ ...job, crew_id: job.crew_id }, dates, createdBy)
  const { error } = await supabase.from('crew_events').insert(rows)
  if (error) {
    console.error('[admin/jobs] schedule write failed:', error.message)
    return { schedule: 'failed' }
  }
  return { scheduled: rows.length }
}

function detailUrl(id: string, outcome: ScheduleOutcome) {
  if (!outcome) return `/admin/jobs/${id}`
  const query = new URLSearchParams(
    'scheduled' in outcome
      ? { scheduled: String(outcome.scheduled) }
      : { schedule: outcome.schedule }
  )
  return `/admin/jobs/${id}?${query}`
}

export async function createJob(formData: FormData) {
  const profile = await requireOffice()
  const values = payload(formData)

  if (!values.name) redirect('/admin/jobs/new?error=name')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...values, created_by: profile.id })
    .select('id')
    .single()

  if (error) {
    console.error('[admin/jobs] create failed:', error.message)
    redirect('/admin/jobs/new?error=save')
  }

  const outcome = await syncCrewSchedule(supabase, { ...values, id: data.id }, profile.id, null)

  revalidatePath('/admin')
  revalidatePath('/admin/jobs')
  revalidatePath('/admin/crews')
  redirect(detailUrl(data.id, outcome))
}

export async function updateJob(formData: FormData) {
  const profile = await requireOffice()

  const id = text(formData, 'id')
  if (!id) redirect('/admin/jobs')

  const values = payload(formData)
  if (!values.name) redirect(`/admin/jobs/${id}/edit?error=name`)

  const supabase = await createClient()

  // What the schedule was built from before this save. Read first, so a
  // rename or a notes edit never touches the calendar.
  const { data: previous } = await supabase
    .from('jobs')
    .select('crew_id, start_date, end_date')
    .eq('id', id)
    .maybeSingle<ScheduleKey>()

  const { error } = await supabase.from('jobs').update(values).eq('id', id)

  if (error) {
    console.error('[admin/jobs] update failed:', error.message)
    redirect(`/admin/jobs/${id}/edit?error=save`)
  }

  const outcome = await syncCrewSchedule(
    supabase,
    { ...values, id },
    profile.id,
    previous ?? { crew_id: null, start_date: null, end_date: null }
  )

  revalidatePath('/admin')
  revalidatePath('/admin/jobs')
  revalidatePath(`/admin/jobs/${id}`)
  revalidatePath('/admin/crews')
  redirect(detailUrl(id, outcome))
}

// ---------------------------------------------------------------------------
// Schedule of Values (80/20 jobs)
// ---------------------------------------------------------------------------

/**
 * Echoed `attempt` so the editor can tell "this save landed" from an older
 * success after more edits — same pattern as the media edit form.
 */
export type SaveSovState = { ok: true; attempt: number } | { ok: false; error: string } | null

const MAX_SOV_LINES = 200

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type SovLineInput = {
  id: string
  item_no: string | null
  description: string
  scheduled_value_cents: number
  previous_completed_cents: number
  this_period_cents: number
  stored_cents: number
  retainage_pct: number
}

function cents(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null
}

function parseLines(raw: string): SovLineInput[] | string {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return 'The lines did not come through. Reload the page and try again.'
  }
  if (!Array.isArray(parsed)) return 'The lines did not come through. Reload the page and try again.'
  if (parsed.length > MAX_SOV_LINES) return `That is more than ${MAX_SOV_LINES} lines — split the job.`

  const lines: SovLineInput[] = []
  const seen = new Set<string>()
  for (const [index, entry] of parsed.entries()) {
    const row = (entry ?? {}) as Record<string, unknown>
    const id = typeof row.id === 'string' && UUID.test(row.id) ? row.id.toLowerCase() : null
    if (!id || seen.has(id)) return 'Something went wrong with a line. Reload the page and try again.'
    seen.add(id)

    const scheduled = cents(row.scheduled_value_cents)
    const previous = cents(row.previous_completed_cents)
    const thisPeriod = cents(row.this_period_cents)
    const stored = cents(row.stored_cents)
    const retainage =
      typeof row.retainage_pct === 'number' && Number.isFinite(row.retainage_pct)
        ? Math.min(100, Math.max(0, row.retainage_pct))
        : null
    if (scheduled === null || previous === null || thisPeriod === null || stored === null || retainage === null) {
      return `Line ${index + 1}: every dollar amount has to be a number, 0 or more.`
    }

    const description = typeof row.description === 'string' ? row.description.trim().slice(0, 500) : ''
    const itemNo = typeof row.item_no === 'string' ? row.item_no.trim().slice(0, 40) : ''
    lines.push({
      id,
      item_no: itemNo || null,
      description,
      scheduled_value_cents: scheduled,
      previous_completed_cents: previous,
      this_period_cents: thisPeriod,
      stored_cents: stored,
      retainage_pct: retainage,
    })
  }
  return lines
}

/**
 * Replace a job's SOV with what the editor holds. Office only (RLS says the
 * same). Line ids are minted in the browser, so a line that is saved twice
 * is the same row twice — upsert on id, then delete whatever this job had
 * that the editor no longer lists. Upsert first on purpose: if the second
 * step fails the worst case is a stale extra line, never a lost one.
 */
export async function saveSov(_prev: SaveSovState, formData: FormData): Promise<SaveSovState> {
  await requireOffice()

  const attempt = Number(text(formData, 'attempt')) || 0
  const jobId = text(formData, 'job_id')
  if (!UUID.test(jobId)) return { ok: false, error: 'Reload the page and try again.' }

  const parsed = parseLines(text(formData, 'lines'))
  if (typeof parsed === 'string') return { ok: false, error: parsed }

  const supabase = await createClient()

  if (parsed.length > 0) {
    const rows = parsed.map((line, index) => ({ ...line, job_id: jobId, sort: index }))
    const { error } = await supabase.from('sov_lines').upsert(rows, { onConflict: 'id' })
    if (error) {
      console.error('[admin/jobs] sov upsert failed:', error.message)
      return { ok: false, error: `Could not save: ${error.message}` }
    }
  }

  let remove = supabase.from('sov_lines').delete().eq('job_id', jobId)
  if (parsed.length > 0) {
    remove = remove.not('id', 'in', `(${parsed.map((line) => line.id).join(',')})`)
  }
  const { error: removeError } = await remove
  if (removeError) {
    console.error('[admin/jobs] sov prune failed:', removeError.message)
    return { ok: false, error: `Saved the lines, but an old one would not delete: ${removeError.message}` }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/jobs/${jobId}`)
  return { ok: true, attempt }
}
