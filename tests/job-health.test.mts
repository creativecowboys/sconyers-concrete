import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assessJob,
  assessJobs,
  assessSov,
  dayRateMoney,
  daysOnSiteByJob,
  healthStatus,
  toDayNumber,
  workingDays,
  type JobRow,
} from '../lib/admin/job-health.ts'
import { summarize } from '../lib/admin/sov.ts'

// Mon Sep 1 2025 → Fri Sep 19 2025 is 15 working days.
const START = '2025-09-01'
const END = '2025-09-19'
const day = (iso: string) => toDayNumber(iso)!

const dayRate = (over: Partial<JobRow> = {}): JobRow => ({
  id: 'd1',
  name: 'Day rate job',
  status: 'active',
  start_date: START,
  end_date: END,
  job_type: 'day_rate',
  day_rate_cents: 250_000,
  days_bid: 15,
  ...over,
})

const eightyTwenty = (over: Partial<JobRow> = {}): JobRow => ({
  id: 'e1',
  name: '80/20 job',
  status: 'active',
  start_date: START,
  end_date: END,
  job_type: 'eighty_twenty',
  contract_cents: 10_000_000,
  crew_share_pct: 80,
  ...over,
})

const sovAt = (pct: number) =>
  summarize([
    {
      scheduled_value_cents: 1_000_000,
      previous_completed_cents: Math.round(1_000_000 * pct),
      this_period_cents: 0,
      stored_cents: 0,
      retainage_pct: 0,
    },
  ])

// ── the pieces that have not changed ──────────────────────────────────────

test('workingDays counts Mon–Fri inclusive', () => {
  assert.equal(workingDays(day(START), day(END)), 15)
  assert.equal(workingDays(day('2025-09-06'), day('2025-09-07')), 0) // Sat–Sun
  assert.equal(workingDays(day(END), day(START)), 0)
})

test('daysOnSiteByJob: distinct dates, multi-day events, nothing after today', () => {
  const today = day('2025-09-10')
  const onSite = daysOnSiteByJob(
    [
      { job_id: 'd1', starts_on: '2025-09-01', ends_on: null },
      { job_id: 'd1', starts_on: '2025-09-01', ends_on: null }, // two crews, one day
      { job_id: 'd1', starts_on: '2025-09-02', ends_on: '2025-09-04' },
      { job_id: 'd1', starts_on: '2025-09-15', ends_on: null }, // future
      { job_id: null, starts_on: '2025-09-03', ends_on: null },
    ],
    today
  )
  assert.equal(onSite.get('d1')?.size, 4)
})

// ── day rate ──────────────────────────────────────────────────────────────

test('day rate: the days bar is unchanged, plus a money line', () => {
  const h = assessJob(dayRate(), 9, day('2025-09-12'))
  assert.equal(h.kind, 'day_rate')
  assert.equal(h.plan?.daysOnSite, 9)
  assert.equal(h.plan?.daysPlanned, 15)
  assert.equal(h.plan?.status, 'on_track')
  assert.equal(h.sov, null)
  assert.deepEqual(h.money, { rateCents: 250_000, earnedCents: 2_250_000, bidCents: 3_750_000, daysBid: 15 })
})

test('day rate: watch at 85% of planned days, behind when over', () => {
  assert.equal(assessJob(dayRate(), 13, day('2025-09-18')).plan?.status, 'watch')
  assert.equal(assessJob(dayRate(), 16, day('2025-09-19')).plan?.status, 'behind')
  assert.equal(assessJob(dayRate(), 16, day('2025-09-19')).plan?.reason, '1 day over')
})

test('day rate: past the end date and still active is behind', () => {
  const h = assessJob(dayRate(), 14, day('2025-09-24'))
  assert.equal(h.plan?.status, 'behind')
  assert.equal(h.plan?.reason, '3 days past end date')
})

test('day rate: no dates → no plan, money still shows when there is a rate', () => {
  const h = assessJob(dayRate({ end_date: null }), 4, day('2025-09-05'))
  assert.equal(h.plan, null)
  assert.equal(h.money?.earnedCents, 1_000_000)
})

test('dayRateMoney: no rate → null; no days bid → bid null', () => {
  assert.equal(dayRateMoney(dayRate({ day_rate_cents: null }), 3), null)
  assert.equal(dayRateMoney(dayRate({ day_rate_cents: 0 }), 3), null)
  const m = dayRateMoney(dayRate({ days_bid: null }), 3)
  assert.equal(m?.bidCents, null)
  assert.equal(m?.earnedCents, 750_000)
})

test('a row with no job_type is treated as day rate (pre-migration rows)', () => {
  assert.equal(assessJob(dayRate({ job_type: null }), 1, day('2025-09-02')).kind, 'day_rate')
})

// ── 80/20 ─────────────────────────────────────────────────────────────────

test('80/20: no SOV lines → sov null, no plan, no pill', () => {
  const h = assessJob(eightyTwenty(), 5, day('2025-09-08'))
  assert.equal(h.kind, 'eighty_twenty')
  assert.equal(h.plan, null)
  assert.equal(h.money, null)
  assert.equal(h.sov, null)
  assert.equal(healthStatus(h), null)
  assert.equal(assessSov(eightyTwenty(), summarize([]), day('2025-09-08')), null)
})

test('80/20: on track when billed % keeps up with the calendar', () => {
  // Sep 12 = 10 of 15 working days elapsed = 66.7%
  const h = assessJob(eightyTwenty(), 0, day('2025-09-12'), sovAt(0.7))
  assert.equal(h.sov?.status, 'on_track')
  assert.equal(h.sov?.reason, null)
  assert.equal(h.sov?.pct, 0.7)
  assert.equal(h.sov?.completedCents, 700_000)
  assert.equal(h.sov?.contractCents, 10_000_000)
  assert.equal(h.sov?.crewCents, 8_000_000)
  assert.equal(h.sov?.sconyersCents, 2_000_000)
  assert.ok(Math.abs((h.sov?.elapsedShare ?? 0) - 10 / 15) < 1e-9)
})

test('80/20: watch between 85% and 100% of where the calendar says', () => {
  // elapsed 66.7%; 60% billed = 90% of elapsed → watch
  const h = assessSov(eightyTwenty(), sovAt(0.6), day('2025-09-12'))
  assert.equal(h?.status, 'watch')
  assert.equal(h?.reason, '7% behind plan')
})

test('80/20: behind under 85% of where the calendar says', () => {
  const h = assessSov(eightyTwenty(), sovAt(0.3), day('2025-09-12'))
  assert.equal(h?.status, 'behind')
  assert.equal(h?.reason, '37% behind plan')
})

test('80/20: past the end date with anything left to bill is behind', () => {
  const h = assessSov(eightyTwenty(), sovAt(0.9), day('2025-09-24'))
  assert.equal(h?.status, 'behind')
  assert.equal(h?.reason, '3 days past end date')
})

test('80/20: fully billed is on track whatever the calendar says', () => {
  const h = assessSov(eightyTwenty(), sovAt(1), day('2025-10-30'))
  assert.equal(h?.status, 'on_track')
  assert.equal(h?.reason, 'Fully billed')
})

test('80/20: SOV without dates shows progress but no pill', () => {
  const h = assessSov(eightyTwenty({ start_date: null }), sovAt(0.4), day('2025-09-12'))
  assert.equal(h?.status, null)
  assert.equal(h?.elapsedShare, null)
  assert.equal(h?.pct, 0.4)
})

test('80/20: no contract amount → split is null, progress still measured', () => {
  const h = assessSov(eightyTwenty({ contract_cents: null }), sovAt(0.5), day('2025-09-12'))
  assert.equal(h?.contractCents, null)
  assert.equal(h?.crewCents, null)
  assert.equal(h?.sconyersCents, null)
  assert.equal(h?.pct, 0.5)
})

test('80/20: crew share other than 80 splits the contract accordingly', () => {
  const h = assessSov(eightyTwenty({ crew_share_pct: 75 }), sovAt(0.5), day('2025-09-12'))
  assert.equal(h?.crewCents, 7_500_000)
  assert.equal(h?.sconyersCents, 2_500_000)
})

// ── the list ──────────────────────────────────────────────────────────────

test('assessJobs: mixed types sort Behind, Watch, On track, then unmeasured', () => {
  const today = '2025-09-12'
  const jobs: JobRow[] = [
    dayRate({ id: 'ok', name: 'B day rate ok' }),
    eightyTwenty({ id: 'nosov', name: 'A no sov' }),
    eightyTwenty({ id: 'behind', name: 'C sov behind' }),
    eightyTwenty({ id: 'watch', name: 'D sov watch' }),
    dayRate({ id: 'nodates', name: 'E no dates', end_date: null }),
  ]
  const sov = new Map([
    ['behind', sovAt(0.1)],
    ['watch', sovAt(0.6)],
  ])
  const events = Array.from({ length: 9 }, (_, i) => ({
    job_id: 'ok',
    starts_on: `2025-09-${String(i + 1).padStart(2, '0')}`,
    ends_on: null,
  }))
  const out = assessJobs(jobs, events, today, sov).map((j) => j.id)
  assert.deepEqual(out, ['behind', 'watch', 'ok', 'nosov', 'nodates'])
})
