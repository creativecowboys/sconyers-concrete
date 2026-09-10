/**
 * Crew schedule derived from the job screen.
 *
 * Dave, Sep 9 2026: "when he is making a job, we need to be able to assign a
 * team or crew at that screen." So a job carries `crew_id`, and saving a job
 * with a crew, a start date and a finish date writes one `crew_events` row
 * per weekday (Mon–Fri) across that span. That is exactly the unit the home
 * widget counts as a day on site, and it puts every working day on the crew's
 * subscribed calendar as its own all-day entry.
 *
 * Everything in here is pure so it can be unit-tested without a database. The
 * Supabase writes live in app/admin/jobs/actions.ts.
 */

import { isWeekday, toDayNumber } from './job-health'

const DAY_MS = 86_400_000

/**
 * A year of working days. A finish date typed as 2099 would otherwise write
 * tens of thousands of rows; past this the action refuses and says so rather
 * than silently truncating.
 */
export const MAX_SCHEDULED_DAYS = 260

/** The three job fields that decide the generated schedule. */
export type ScheduleKey = {
  crew_id: string | null
  start_date: string | null
  end_date: string | null
}

export function scheduleChanged(prev: ScheduleKey, next: ScheduleKey) {
  return (
    (prev.crew_id ?? null) !== (next.crew_id ?? null) ||
    (prev.start_date ?? null) !== (next.start_date ?? null) ||
    (prev.end_date ?? null) !== (next.end_date ?? null)
  )
}

/** Whole days since epoch → "YYYY-MM-DD". Inverse of toDayNumber. */
export function dayToIso(day: number) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Every Mon–Fri from `from` through `to`, inclusive, as ISO dates. `notBefore`
 * clamps the start (used on edit so the past is never regenerated). Empty when
 * the span has no weekdays in it or either date is unreadable.
 */
export function weekdayDates(from: string, to: string, notBefore?: string): string[] {
  const start = toDayNumber(from)
  const end = toDayNumber(to)
  if (start === null || end === null) return []
  const floor = notBefore ? toDayNumber(notBefore) : null
  const first = floor === null ? start : Math.max(start, floor)

  const dates: string[] = []
  for (let d = first; d <= end; d += 1) if (isWeekday(d)) dates.push(dayToIso(d))
  return dates
}

export type ScheduleJob = {
  id: string
  name: string
  address: string | null
  city: string | null
  crew_id: string
}

export type CrewEventInsert = {
  crew_id: string
  job_id: string
  title: string
  location: string | null
  starts_on: string
  ends_on: null
  created_by: string
}

/** The calendar line is the job name; the location is what the crew types into maps. */
export function crewEventRows(job: ScheduleJob, dates: string[], createdBy: string): CrewEventInsert[] {
  const location = [job.address, job.city].filter(Boolean).join(', ') || null
  return dates.map((date) => ({
    crew_id: job.crew_id,
    job_id: job.id,
    title: job.name,
    location,
    starts_on: date,
    ends_on: null,
    created_by: createdBy,
  }))
}
