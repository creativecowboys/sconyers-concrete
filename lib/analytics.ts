import { sendGAEvent } from '@next/third-parties/google'
import { isStaffPath } from './analytics-rules'

/**
 * Google Analytics 4 measurement ID ("G-…"). Inlined at build time, so the
 * tag only exists in builds made while NEXT_PUBLIC_GA_ID is set — set it for
 * Production in Vercel and redeploy. Unset (local dev, previews, today's live
 * site) means no tag, no listener and no events at all.
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

/**
 * Google Ads conversion tag ("AW-…") and the two conversion action labels from
 * Google Ads → Goals → Conversions → (action) → Tag setup. Inlined at build
 * time like GA_ID. Any of them unset means that conversion simply never fires.
 */
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? ''
const ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL ?? ''
const ADS_CALL_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_LABEL ?? ''

/** The id gtag.js is loaded with: GA4 when we have it, otherwise the Ads tag. */
export const TAG_ID = GA_ID || ADS_ID

/**
 * Send one GA4 event from a public page. Does nothing without an ID or on the
 * staff admin, and swallows anything it throws: analytics must never be able
 * to break a form or a phone link.
 */
export function trackEvent(name: string, params: Record<string, string>) {
  if (!GA_ID || typeof window === 'undefined') return
  if (isStaffPath(window.location.pathname)) return
  try {
    sendGAEvent('event', name, params)
  } catch {
    // ignore: a failed analytics call is not worth surfacing to the visitor
  }
}

/** "706-669-3089" → "+17066693089", the format Google's enhanced conversions expect. */
function toE164(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return undefined
}

/**
 * Report a Google Ads conversion: `lead` after /api/contact accepts a form,
 * `call` when a `tel:` link is tapped. For a lead, the visitor's email and
 * phone go to Google as enhanced-conversion user data (gtag hashes them before
 * sending), which is what lets Google credit the ad when cookies are blocked.
 */
export function trackAdsConversion(
  kind: 'lead' | 'call',
  user?: { email?: string; phone?: string }
) {
  const label = kind === 'lead' ? ADS_LEAD_LABEL : ADS_CALL_LABEL
  if (!ADS_ID || !label || typeof window === 'undefined') return
  if (isStaffPath(window.location.pathname)) return
  try {
    if (user) {
      const userData: Record<string, string> = {}
      if (user.email) userData.email = user.email.trim().toLowerCase()
      const phone = user.phone ? toE164(user.phone) : undefined
      if (phone) userData.phone_number = phone
      if (Object.keys(userData).length) sendGAEvent('set', 'user_data', userData)
    }
    sendGAEvent('event', 'conversion', { send_to: `${ADS_ID}/${label}` })
  } catch {
    // ignore: tracking must never break the form or the phone link
  }
}

/**
 * Google's own opt-out switch (`window['ga-disable-<ID>']`), defined as a
 * getter that reads the current address every time GA checks it. The tag is
 * never loaded on /admin, but if someone moves from a public page into the
 * admin inside one browser tab, GA is already running there and would log the
 * route change as a page view; this keeps every hit from /admin out.
 */
export function installStaffOptOut() {
  if (!GA_ID || typeof window === 'undefined') return
  try {
    Object.defineProperty(window, `ga-disable-${GA_ID}`, {
      configurable: true,
      get: () => isStaffPath(window.location.pathname),
    })
  } catch {
    // ignore: the tag simply runs without the extra guard
  }
}
