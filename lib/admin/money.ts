/**
 * Money is stored as integer cents and typed as dollars. These are the only
 * two conversions, kept pure so they can be unit-tested and used from both
 * server actions and client components.
 */

/**
 * "1,250.50" → 125050. Accepts a leading "$", commas and spaces. Returns null
 * for blank input and NaN-ish strings, so a cleared field saves as null
 * rather than 0. Negative amounts are not money on a job sheet — null.
 */
export function dollarsToCents(input: string | null | undefined): number | null {
  if (input == null) return null
  const cleaned = input.replace(/[$,\s]/g, '')
  if (cleaned === '') return null
  if (!/^\d*(\.\d*)?$/.test(cleaned)) return null
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100)
}

/** 125050 → "$1,250.50". Whole dollars drop the cents: 125000 → "$1,250". */
export function formatCents(cents: number | null | undefined, opts?: { always?: boolean }) {
  if (cents == null || !Number.isFinite(cents)) return '—'
  const whole = Math.round(cents) % 100 === 0 && !opts?.always
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(Math.round(cents) / 100)
}

/** 125050 → "1250.50" for an <input type=number> defaultValue. "" when null. */
export function centsToInput(cents: number | null | undefined) {
  if (cents == null || !Number.isFinite(cents)) return ''
  const rounded = Math.round(cents)
  return rounded % 100 === 0 ? String(rounded / 100) : (rounded / 100).toFixed(2)
}

/** "80" or "80.5" → 80 / 80.5, clamped to 0–100. null when unreadable. */
export function parsePercent(input: string | null | undefined): number | null {
  if (input == null) return null
  const cleaned = input.replace(/[%\s]/g, '')
  if (cleaned === '') return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.min(100, Math.max(0, value))
}

/**
 * Split a contract by the crew's percentage, in cents, with no penny lost:
 * the crew gets the rounded share and Sconyers gets the remainder.
 */
export function splitContract(contractCents: number, crewSharePct: number) {
  const crew = Math.round((contractCents * crewSharePct) / 100)
  return { crew, sconyers: contractCents - crew }
}
