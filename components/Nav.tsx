'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { site } from '@/lib/site'

const links = [
  { href: '/', label: 'Home' },
  { href: '/#services', label: 'Services' },
  { href: '/#about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname])

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
      <div className="nav-inner">
        <Link href="/" className="logo">
          <Image
            src="/images/logo.png"
            alt="Sconyers Concrete logo"
            className="logo-img"
            width={162}
            height={158}
            priority
          />
          <span className="logo-text">
            Sconyers
            <br />
            <em>Concrete, Inc.</em>
          </span>
        </Link>
        <ul className={`nav-links${open ? ' open' : ''}`}>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <a href={site.phoneHref} className="nav-cta">
          {site.phone}
        </a>
        <button
          className="nav-toggle"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}
