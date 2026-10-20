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
