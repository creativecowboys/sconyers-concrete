/**
 * Paid-click attribution for estimate requests.
 *
 * When a visitor lands from a Google ad, the URL carries a click id (`gclid`,
 * or `gbraid` / `wbraid` from iOS) and our `utm_*` tags. We keep the first set
 * we see for the browser session, so a lead still carries it after the visitor
 * clicks around the site before filling in a form. The form sends these along
 * with the lead: Chip's email and the GHL note then show which campaign and
 * search term produced it, and the click id lets us upload closed jobs back to
 * Google Ads later as offline conversions.
 */

export const ATTRIBUTION_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const

export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>

const STORAGE_KEY = 'sc_attribution'

/** Save the click's tags for this session. Keeps the first click; ignores pages with none. */
export function captureAttribution(search: string) {
  try {
    const params = new URLSearchParams(search)
    const found: Attribution = {}
    for (const key of ATTRIBUTION_KEYS) {
      const value = params.get(key)?.trim()
      if (value) found[key] = value.slice(0, 200)
    }
    if (Object.keys(found).length === 0) return
    if (window.sessionStorage.getItem(STORAGE_KEY)) return
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found))
  } catch {
    // Storage blocked (private mode, strict settings): the lead still sends.
  }
}

export function readAttribution(): Attribution {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Attribution) : {}
  } catch {
    return {}
  }
}

/** True when the lead came from a paid Google click. */
export function isGoogleAdsLead(attr: Attribution): boolean {
  return Boolean(
    attr.gclid ||
      attr.gbraid ||
      attr.wbraid ||
      (attr.utm_source === 'google' && attr.utm_medium === 'cpc')
  )
}
