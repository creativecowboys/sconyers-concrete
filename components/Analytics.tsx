'use client'

import { GoogleAnalytics } from '@next/third-parties/google'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { GA_ID, installStaffOptOut, trackEvent } from '@/lib/analytics'
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
 */
export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (!GA_ID) return

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
        trackEvent('click_to_call', { ...where, phone_line: phoneLine(href, site.phoneHref) })
      } else {
        trackEvent('click_email', where)
      }
    }

    // Capture phase, so nothing on the page can stop the click before we see it.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  if (!GA_ID || isStaffPath(pathname)) return null
  return <GoogleAnalytics gaId={GA_ID} />
}
