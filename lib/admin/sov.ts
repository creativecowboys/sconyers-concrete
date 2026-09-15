/**
 * Schedule of Values math. Pure — no imports — so it runs in the browser
 * (the editor recomputes every keystroke), in server components and in the
 * unit tests.
 *
 * Columns follow the AIA G703 continuation sheet, which is what Chip said he
 * bills from (Sep 15 2026). His own sheet has not reached us, so:
 *
 *   total completed  = previous + this period + stored materials
 *   % complete       = total completed ÷ scheduled value
 *   balance          = scheduled value − total completed
 *   retainage        = total completed × retainage %
 *
 * If his sheet turns out to differ (retainage on work only, not stored; or a
 * job-level retainage instead of per line), this is the one file to change.
 */

export type SovInput = {
  scheduled_value_cents: number
  previous_completed_cents: number
  this_period_cents: number
  stored_cents: number
  retainage_pct: number
}

export type SovLineTotals = {
  completed: number
  /** 0–1. 0 when the scheduled value is 0. Can exceed 1 if over-billed. */
  pct: number
  balance: number
  retainage: number
}

export type SovSummary = {
  lines: number
  scheduled: number
  previous: number
  thisPeriod: number
  stored: number
  completed: number
  balance: number
  retainage: number
  /** Σ completed ÷ Σ scheduled, 0–1 (or above 1 if over-billed). 0 with no scheduled value. */
  pct: number
}

function n(value: number) {
  return Number.isFinite(value) ? value : 0
}

export function lineTotals(line: SovInput): SovLineTotals {
  const scheduled = n(line.scheduled_value_cents)
  const completed = n(line.previous_completed_cents) + n(line.this_period_cents) + n(line.stored_cents)
  return {
    completed,
    pct: scheduled > 0 ? completed / scheduled : 0,
    balance: scheduled - completed,
    retainage: Math.round((completed * n(line.retainage_pct)) / 100),
  }
}

export function summarize(lines: SovInput[]): SovSummary {
  const sum: SovSummary = {
    lines: lines.length,
    scheduled: 0,
    previous: 0,
    thisPeriod: 0,
    stored: 0,
    completed: 0,
    balance: 0,
    retainage: 0,
    pct: 0,
  }
  for (const line of lines) {
    const t = lineTotals(line)
    sum.scheduled += n(line.scheduled_value_cents)
    sum.previous += n(line.previous_completed_cents)
    sum.thisPeriod += n(line.this_period_cents)
    sum.stored += n(line.stored_cents)
    sum.completed += t.completed
    sum.balance += t.balance
    sum.retainage += t.retainage
  }
  sum.pct = sum.scheduled > 0 ? sum.completed / sum.scheduled : 0
  return sum
}

/** "42%" — rounded, never "NaN%". Over-billed shows as "104%" on purpose. */
export function formatPct(share: number) {
  return `${Math.round(n(share) * 100)}%`
}
