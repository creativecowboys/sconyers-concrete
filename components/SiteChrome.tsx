'use client'

import { usePathname } from 'next/navigation'

/**
 * Hides the marketing header/footer on the admin and the Google Ads pages.
 *
 * The admin lives under the same root layout as the public site (moving pages
 * into a route group would have collided with the copy work in flight), so the
 * chrome is wrapped instead. `children` is passed in from the server layout, so
 * TopBar/Nav/Footer stay server components — this boundary only decides whether
 * to render them, and emits nothing of its own on the marketing pages.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // The Google Ads pages (/go/...) carry their own slim header and footer:
  // no menu to wander off through, just the phone number and the form.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/go/')) return null
  return <>{children}</>
}
