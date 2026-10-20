/**
 * The rules behind the site's Google Analytics events, kept free of imports so
 * `tests/analytics.test.mts` can run them under plain Node.
 *
 * The browser side (loading the tag, sending events) is `lib/analytics.ts` and
 * `components/Analytics.tsx`.
 */

/**
 * The staff admin and everything that belongs to it — sign-in, the magic-link
 * callback, jobs, crews, docs, media — lives under /admin. None of it ever
 * reports to Google Analytics.
 */
export function isStaffPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export type ContactLinkKind = 'tel' | 'mailto'

/** `tel:` and `mailto:` links are the only clicks we count. */
export function contactLinkKind(href: string | null | undefined): ContactLinkKind | null {
  const value = (href ?? '').trim().toLowerCase()
  if (value.startsWith('tel:')) return 'tel'
  if (value.startsWith('mailto:')) return 'mailto'
  return null
}

/** The ten-digit US number in a `tel:` href ("tel:+1 706-669-3089" → "7066693089"). */
export function phoneDigits(href: string): string {
  const digits = href.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
}

/**
 * Which line a call went to. "main" is the office number in `lib/site.ts`;
 * anything else (the contact page lists the controller's direct line) is
 * "other". A label rather than the number itself: Google's terms forbid
 * sending phone numbers to Analytics.
 */
export function phoneLine(href: string, mainHref: string): 'main' | 'other' {
  return phoneDigits(href) === phoneDigits(mainHref) ? 'main' : 'other'
}

/** The slice of a DOM element `linkLocation` needs, so tests can fake it. */
export type LocatableElement = {
  closest(selector: string): { id?: string; className?: unknown } | null
}

/**
 * Where on the page a link sits, checked in order — the first container that
 * matches wins, so the more specific rules come first. A link added later
 * anywhere on the site is covered without touching it: if none of these
 * match, the name of the section it sits in is used.
 */
export const LOCATION_RULES: ReadonlyArray<readonly [selector: string, location: string]> = [
  ['nav, header', 'header'],
  ['footer', 'footer'],
  // The "Thanks — we got it" note that replaces a sent form.
  ['.contact-form, .contact-page-form', 'form_thanks'],
  // Contact page: the per-person cards (Brice, Heather).
  ['.team-contacts', 'contact_team'],
  ['.hero, .contact-page-hero', 'hero'],
  // Contact page: the address / phone / email / hours column.
  ['.contact-page-body', 'contact_details'],
  // Home and landing pages: the "Get in touch" block next to the form.
  ['section.contact', 'contact_section'],
  // Landing pages: the closing call-to-action bands.
  ['.lp-band', 'cta_band'],
]

function snake(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function linkLocation(link: LocatableElement): string {
  for (const [selector, location] of LOCATION_RULES) {
    if (link.closest(selector)) return location
  }
  const section = link.closest('section')
  if (section) {
    if (section.id) return snake(section.id)
    const firstClass = typeof section.className === 'string' ? section.className.split(/\s+/)[0] : ''
    if (firstClass) return snake(firstClass)
    return 'section'
  }
  return 'page'
}
