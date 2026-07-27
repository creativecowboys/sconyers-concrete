'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Fades `.reveal` elements in as they scroll into view.
 *
 * Port of the IntersectionObserver block in the old script.js. The one
 * difference: the `.reveal` class is now rendered server-side rather than
 * added by JS on load, so there's no flash of fully-visible content before
 * hydration. Stagger delays are set inline where the markup needs them.
 */
export default function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('.reveal:not(.visible)')
    )
    if (targets.length === 0) return

    // No IntersectionObserver (or reduced motion): just show everything.
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      targets.forEach((el) => el.classList.add('visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12 }
    )

    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])

  return null
}
