'use client'

import { usePathname } from 'next/navigation'

/**
 * Hides the marketing header/footer on the admin.
 *
 * The admin lives under the same root layout as the public site (moving pages
 * into a route group would have collided with the copy work in flight), so the
 * chrome is wrapped instead. `children` is passed in from the server layout, so
 * TopBar/Nav/Footer stay server components — this boundary only decides whether
 * to render them, and emits nothing of its own on the marketing pages.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <>{children}</>
}
