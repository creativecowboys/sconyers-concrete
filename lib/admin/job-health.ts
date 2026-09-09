/**
 * Job health, version one — derived only from data the admin already holds.
 *
 * Chip's question is "is this job on track, mainly by how many days the crew
 * has been on site." Until he answers the scoping email (days bid, pours,
 * 80/20 vs day rate) there is no bid to measure against, so version one uses:
 *
 *   days on site  = distinct calendar dates ≤ today with a crew event on the job
 *   days planned  = working days (Mon–Fri) from jobs.start_date to end_date
 *
 * No new columns, nothing guessed. A job with no start or end date has no
 * plan and is shown as "No schedule yet".
 *
 * TODO(chip): a second bar for pours done vs pours planned, once Chip says
 * how he counts progress. Day-rate jobs will need a different view entirely
 * (days are revenue there, not a budget).
 */

export type HealthStatus = 'behind' | 'watch' | 'on_track'

export type JobHealth = {
  id: string
  name: string
  /** Crews that have been scheduled on this job, by name. Empty when nobody has. */
  crews?: string[]
  /** The job's end_date — the day the crew is expected to be done. */
  due?: { date: string; past: boolean } | null
  /** null when the job has no start or end date — nothing to measure against. */
  plan: {
    daysOnSite: number
    daysPlanned: number
    /** Working days elapsed since start ÷ days planned, 0–1. */
    elapsedShare: number
    status: HealthStatus
    /** Short, cheap explanation for the pill. null when there is nothing to say. */
    reason: string | null
  } | null
}

export type JobRow = {
  id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
}

export type ScheduleRow = {
  job_id: string | null
  starts_on: string
  ends_on: string | null
  /** Joined crew name — Supabase returns the many-to-one as a single object. */
  crews?: { name: string } | null
}

/**
 * "Watch" kicks in when the crew has used this share of the planned days and
 * the job is not done. A guess until Chip weighs in.
 */
export const WATCH_SHARE = 0.85

const DAY_MS = 86_400_000

/** "YYYY-MM-DD" → whole days since epoch. Never touches the server timezone. */
export function toDayNumber(iso: string): number | null {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}

function isWeekday(day: number) {
  const dow = new Date(day * DAY_MS).getUTCDay()
  return dow !== 0 && dow !== 6
}

/** Mon–Fri count from `from` through `to`, inclusive. 0 when `to` < `from`. */
export function workingDays(from: number, to: number) {
  let n = 0
  for (let d = from; d <= to; d++) if (isWeekday(d)) n += 1
  return n
}

/**
 * Distinct dates ≤ today that any crew event covers, keyed by job id. A
 * multi-day event counts every date in its range; two crews on the same day
 * still count as one day on site. Weekends count if a crew was scheduled.
 */
export function daysOnSiteByJob(events: ScheduleRow[], today: number) {
  const byJob = new Map<string, Set<number>>()
  for (const event of events) {
    if (!event.job_id) continue
    const start = toDayNumber(event.starts_on)
    if (start === null || start > today) continue
    const rawEnd = event.ends_on ? (toDayNumber(event.ends_on) ?? start) : start
    const end = Math.min(Math.max(rawEnd, start), today)
    let dates = byJob.get(event.job_id)
    if (!dates) {
      dates = new Set()
      byJob.set(event.job_id, dates)
    }
    for (let d = start; d <= end; d += 1) dates.add(d)
  }
  return byJob
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function assessJob(job: JobRow, daysOnSite: number, today: number): JobHealth {
  const start = job.start_date ? toDayNumber(job.start_date) : null
  const end = job.end_date ? toDayNumber(job.end_date) : null
  if (start === null || end === null) return { id: job.id, name: job.name, plan: null }

  const daysPlanned = workingDays(start, end)
  // A span with no weekdays in it (weekend-only, or end before start) is not
  // a plan we can measure against. Treat it the same as missing dates.
  if (daysPlanned === 0) return { id: job.id, name: job.name, plan: null }

  const elapsedShare = Math.min(1, workingDays(start, today) / daysPlanned)

  let status: HealthStatus = 'on_track'
  let reason: string | null = null

  const over = daysOnSite - daysPlanned
  if (over > 0) {
    status = 'behind'
    reason = `${plural(over, 'day')} over`
  } else if (today > end && job.status === 'active') {
    status = 'behind'
    const past = workingDays(end + 1, today)
    reason = past > 0 ? `${plural(past, 'day')} past end date` : 'Past end date'
  } else if (job.status !== 'complete' && daysOnSite >= WATCH_SHARE * daysPlanned) {
    status = 'watch'
    const left = daysPlanned - daysOnSite
    reason = left > 0 ? `${plural(left, 'day')} left` : 'No days left'
  }

  return {
    id: job.id,
    name: job.name,
    plan: { daysOnSite, daysPlanned, elapsedShare, status, reason },
  }
}

const ORDER: Record<HealthStatus, number> = { behind: 0, watch: 1, on_track: 2 }

/** Behind first, then Watch, then On track, then jobs with no schedule. */
export function assessJobs(jobs: JobRow[], events: ScheduleRow[], todayIso: string): JobHealth[] {
  const today = toDayNumber(todayIso)
  if (today === null) return []
  const onSite = daysOnSiteByJob(events, today)
  return jobs
    .map((job) => assessJob(job, onSite.get(job.id)?.size ?? 0, today))
    .sort((a, b) => {
      const ra = a.plan ? ORDER[a.plan.status] : 3
      const rb = b.plan ? ORDER[b.plan.status] : 3
      return ra - rb || a.name.localeCompare(b.name)
    })
}
