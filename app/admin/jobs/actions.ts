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
import { JOB_STATUSES, type JobStatus } from '@/lib/admin/types'
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

function payload(formData: FormData) {
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
