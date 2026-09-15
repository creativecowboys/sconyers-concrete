/**
 * Job health — derived from data the admin already holds, per job type.
 *
 * Chip's question is "is this job on track, mainly by how many days the crew
 * has been on site." Since Sep 15 2026 we know how he bills, so there are
 * two views:
 *
 *   day_rate      days on site  = distinct calendar dates ≤ today with a crew
 *                                 event on the job
 *                 days planned  = working days (Mon–Fri) from start to finish
 *                 money line    = days on site × day rate, against days bid × rate
 *
 *   eighty_twenty % complete    = Σ SOV total completed ÷ Σ SOV scheduled value
 *                 compared to the share of the schedule (start→finish) that
 *                 has elapsed. Contract split crew / Sconyers by crew_share_pct.
 *                 No SOV lines yet → nothing to measure, "No SOV yet".
 *
 * Everything here is pure: the SOV totals come in already summed (lib/admin/sov.ts),
 * so the only import is a type — erased at runtime, which is what lets
 * `node --experimental-strip-types` run the unit tests against this file directly.
 */

import type { SovSummary } from './sov'

export type HealthStatus = 'behind' | 'watch' | 'on_track'

export type JobKind = 'day_rate' | 'eighty_twenty'

/** Day-rate money line: what the days on site have earned against the bid. */
export type DayRateMoney = {
  rateCents: number
  earnedCents: number
  /** days_bid × rate. null when the job has no days bid. */
  bidCents: number | null
  daysBid: number | null
}

/** 80/20 progress: the SOV rolled up, compared to the schedule. */
export type SovHealth = {
  /** Σ completed ÷ Σ scheduled, 0–1 (above 1 when over-billed). */
  pct: number
  completedCents: number
  scheduledCents: number
  contractCents: number | null
  crewCents: number | null
  sconyersCents: number | null
  /** Working days elapsed since start ÷ days planned, 0–1. null without both dates. */
  elapsedShare: number | null
  /** null when there is no schedule to compare against. */
  status: HealthStatus | null
  reason: string | null
}

export type JobHealth = {
  id: string
  name: string
  kind: JobKind
  /** Crews that have been scheduled on this job, by name. Empty when nobody has. */
  crews?: string[]
  /** The job's end_date — the day the crew is expected to be done. */
  due?: { date: string; past: boolean } | null
  /**
   * Day-rate jobs only. null when the job has no start or end date — nothing
   * to measure against. Always null on an 80/20 job, which uses `sov`.
   */
  plan: {
    daysOnSite: number
    daysPlanned: number
    /** Working days elapsed since start ÷ days planned, 0–1. */
    elapsedShare: number
    status: HealthStatus
    /** Short, cheap explanation for the pill. null when there is nothing to say. */
    reason: string | null
  } | null
  /** Day-rate jobs only. null until a day rate is entered. */
  money: DayRateMoney | null
  /** 80/20 jobs only. null until the SOV has at least one line. */
  sov: SovHealth | null
}

export type JobRow = {
  id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
  job_type?: JobKind | null
  day_rate_cents?: number | null
  days_bid?: number | null
  contract_cents?: number | null
  crew_share_pct?: number | null
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

export function isWeekday(day: number) {
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

function kindOf(job: JobRow): JobKind {
  return job.job_type === 'eighty_twenty' ? 'eighty_twenty' : 'day_rate'
}

/** Working-day plan from the job's dates. null when either is missing or the span has no weekdays. */
function planSpan(job: JobRow, today: number) {
  const start = job.start_date ? toDayNumber(job.start_date) : null
  const end = job.end_date ? toDayNumber(job.end_date) : null
  if (start === null || end === null) return null
  const daysPlanned = workingDays(start, end)
  // A span with no weekdays in it (weekend-only, or end before start) is not
  // a plan we can measure against. Treat it the same as missing dates.
  if (daysPlanned === 0) return null
  const elapsedShare = Math.min(1, workingDays(start, today) / daysPlanned)
  return { start, end, daysPlanned, elapsedShare }
}

/** Day rate × days: what the crew has earned so far and what the job was bid at. */
export function dayRateMoney(job: JobRow, daysOnSite: number): DayRateMoney | null {
  const rate = job.day_rate_cents ?? null
  if (rate === null || rate <= 0) return null
  const daysBid = job.days_bid ?? null
  return {
    rateCents: rate,
    earnedCents: daysOnSite * rate,
    bidCents: daysBid === null ? null : daysBid * rate,
    daysBid,
  }
}

/**
 * 80/20: SOV % complete against the share of the schedule that has gone by.
 * Same 85% Watch line as the day-rate bar — billed at least 85% of where the
 * calendar says it should be is Watch; less is Behind. Past the finish date
 * and still active with anything left to bill is Behind. Fully billed is On
 * track whatever the calendar says.
 */
export function assessSov(job: JobRow, sov: SovSummary | null | undefined, today: number): SovHealth | null {
  if (!sov || sov.lines === 0) return null

  const contract = job.contract_cents ?? null
  const sharePct = job.crew_share_pct ?? 80
  const crew = contract === null ? null : Math.round((contract * sharePct) / 100)
  const span = planSpan(job, today)

  let status: HealthStatus | null = null
  let reason: string | null = null

  if (span) {
    const gap = Math.round((span.elapsedShare - sov.pct) * 100)
    if (sov.pct >= 1) {
      status = 'on_track'
      reason = 'Fully billed'
    } else if (today > span.end && job.status === 'active') {
      status = 'behind'
      const past = workingDays(span.end + 1, today)
      reason = past > 0 ? `${plural(past, 'day')} past end date` : 'Past end date'
    } else if (sov.pct >= span.elapsedShare) {
      status = 'on_track'
    } else if (sov.pct >= WATCH_SHARE * span.elapsedShare) {
      status = 'watch'
      reason = `${gap}% behind plan`
    } else {
      status = 'behind'
      reason = `${gap}% behind plan`
    }
  }

  return {
    pct: sov.pct,
    completedCents: sov.completed,
    scheduledCents: sov.scheduled,
    contractCents: contract,
    crewCents: crew,
    sconyersCents: contract === null || crew === null ? null : contract - crew,
    elapsedShare: span ? span.elapsedShare : null,
    status,
    reason,
  }
}

export function assessJob(
  job: JobRow,
  daysOnSite: number,
  today: number,
  sov?: SovSummary | null
): JobHealth {
  const kind = kindOf(job)
  const base = { id: job.id, name: job.name, kind }

  if (kind === 'eighty_twenty') {
    return { ...base, plan: null, money: null, sov: assessSov(job, sov, today) }
  }

  const money = dayRateMoney(job, daysOnSite)
  const span = planSpan(job, today)
  if (!span) return { ...base, plan: null, money, sov: null }
  const { end, daysPlanned, elapsedShare } = span

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
    ...base,
    plan: { daysOnSite, daysPlanned, elapsedShare, status, reason },
    money,
    sov: null,
  }
}

const ORDER: Record<HealthStatus, number> = { behind: 0, watch: 1, on_track: 2 }

/** The pill a row shows, whichever view it uses. null = no pill. */
export function healthStatus(job: JobHealth): HealthStatus | null {
  if (job.plan) return job.plan.status
  if (job.sov) return job.sov.status
  return null
}

/** Behind first, then Watch, then On track, then jobs with nothing to measure. */
export function assessJobs(
  jobs: JobRow[],
  events: ScheduleRow[],
  todayIso: string,
  sovByJob?: Map<string, SovSummary>
): JobHealth[] {
  const today = toDayNumber(todayIso)
  if (today === null) return []
  const onSite = daysOnSiteByJob(events, today)
  return jobs
    .map((job) => assessJob(job, onSite.get(job.id)?.size ?? 0, today, sovByJob?.get(job.id)))
    .sort((a, b) => {
      const sa = healthStatus(a)
      const sb = healthStatus(b)
      const ra = sa ? ORDER[sa] : 3
      const rb = sb ? ORDER[sb] : 3
      return ra - rb || a.name.localeCompare(b.name)
    })
}
