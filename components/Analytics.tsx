'use client'

import { GoogleAnalytics } from '@next/third-parties/google'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  ADS_ID,
  GA_ID,
  TAG_ID,
  installStaffOptOut,
  trackAdsConversion,
  trackEvent,
} from '@/lib/analytics'
import { captureAttribution } from '@/lib/attribution'
import { contactLinkKind, isStaffPath, linkLocation, phoneLine } from '@/lib/analytics-rules'
import { site } from '@/lib/site'

// Runs once when this file loads in the browser, before gtag.js can.
installStaffOptOut()

/**
 * Google Analytics 4 for the public site.
 *
 * - Renders nothing at all unless NEXT_PUBLIC_GA_ID was set at build time.
 * - Never loads the tag on /admin (the staff admin, its sign-in and callback).
 * - One click listener on the whole document reports every `tel:` link as
 *   `click_to_call` and every `mailto:` link as `click_email`, so a phone link
 *   added anywhere later is counted without touching it.
 *
 * Form submissions are reported by `components/ContactForm.tsx` itself, after
 * /api/contact says the lead went through.
 *
 * Google Ads: when NEXT_PUBLIC_GOOGLE_ADS_ID is set the same gtag.js also
 * carries the Ads tag, and a `tel:` tap counts as the "call" conversion. The
 * ad click's gclid/utm tags are saved for the session either way, so leads
 * carry them (see lib/attribution.ts).
 */
export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    captureAttribution(window.location.search)
  }, [pathname])

  useEffect(() => {
    if (!TAG_ID) return

    function onClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest('a[href]')
      if (!link) return
      const href = link.getAttribute('href') ?? ''
      const kind = contactLinkKind(href)
      if (!kind) return

      const where = {
        link_location: linkLocation(link),
        page_path: window.location.pathname,
      }
      if (kind === 'tel') {
        const line = phoneLine(href, site.phoneHref)
        trackEvent('click_to_call', { ...where, phone_line: line })
        if (line === 'main') trackAdsConversion('call')
      } else {
        trackEvent('click_email', where)
      }
    }

    // Capture phase, so nothing on the page can stop the click before we see it.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  if (!TAG_ID || isStaffPath(pathname)) return null
  return (
    <>
      <GoogleAnalytics gaId={TAG_ID} />
      {/* GA4 is the primary id above; this adds the Ads tag to the same gtag.
          afterInteractive scripts run in render order, so gtag exists here. */}
      {GA_ID && ADS_ID && (
        <Script id="_ads-config">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('config','${ADS_ID}',{allow_enhanced_conversions:true});`}
        </Script>
      )}
    </>
  )
}
