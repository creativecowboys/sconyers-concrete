import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatPct, lineTotals, summarize } from '../lib/admin/sov.ts'

const line = (over: Partial<Parameters<typeof lineTotals>[0]> = {}) => ({
  scheduled_value_cents: 100_000,
  previous_completed_cents: 0,
  this_period_cents: 0,
  stored_cents: 0,
  retainage_pct: 0,
  ...over,
})

test('lineTotals: total completed = previous + this period + stored', () => {
  const t = lineTotals(line({ previous_completed_cents: 20_000, this_period_cents: 30_000, stored_cents: 5_000 }))
  assert.equal(t.completed, 55_000)
  assert.equal(t.pct, 0.55)
  assert.equal(t.balance, 45_000)
  assert.equal(t.retainage, 0)
})

test('lineTotals: retainage is a share of total completed, rounded to a cent', () => {
  const t = lineTotals(line({ previous_completed_cents: 33_333, retainage_pct: 10 }))
  assert.equal(t.retainage, 3_333)
})

test('lineTotals: zero scheduled value is 0%, never NaN', () => {
  const t = lineTotals(line({ scheduled_value_cents: 0, this_period_cents: 100 }))
  assert.equal(t.pct, 0)
  assert.equal(t.balance, -100)
})

test('lineTotals: over-billing shows above 100%', () => {
  const t = lineTotals(line({ previous_completed_cents: 120_000 }))
  assert.equal(t.pct, 1.2)
  assert.equal(t.balance, -20_000)
})

test('summarize: job % complete is Σ completed ÷ Σ scheduled, not an average of line %s', () => {
  const s = summarize([
    line({ scheduled_value_cents: 900_000, previous_completed_cents: 0 }), // 0%
    line({ scheduled_value_cents: 100_000, previous_completed_cents: 100_000 }), // 100%
  ])
  assert.equal(s.lines, 2)
  assert.equal(s.scheduled, 1_000_000)
  assert.equal(s.completed, 100_000)
  assert.equal(s.pct, 0.1)
  assert.equal(s.balance, 900_000)
})

test('summarize: empty SOV is all zeros', () => {
  const s = summarize([])
  assert.equal(s.lines, 0)
  assert.equal(s.pct, 0)
  assert.equal(s.scheduled, 0)
})

test('summarize: non-finite inputs count as 0', () => {
  const s = summarize([line({ this_period_cents: Number.NaN, scheduled_value_cents: 50_000 })])
  assert.equal(s.completed, 0)
  assert.equal(s.scheduled, 50_000)
})

test('formatPct rounds and never prints NaN', () => {
  assert.equal(formatPct(0.4249), '42%')
  assert.equal(formatPct(1.04), '104%')
  assert.equal(formatPct(Number.NaN), '0%')
})
