'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/lib/admin/types'

type Item = { href: string; label: string; officeOnly?: boolean }

const ITEMS: Item[] = [
  { href: '/admin', label: 'Home' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/upload', label: 'Upload' },
  { href: '/admin/media', label: 'Review', officeOnly: true },
  { href: '/admin/change-orders', label: 'Change orders' },
  { href: '/admin/crews', label: 'Crews', officeOnly: true },
]

export default function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname()

  const items = ITEMS.filter((item) => !item.officeOnly || role === 'office')

  return (
    <nav className="adm-nav" aria-label="Admin sections">
      <div className="adm-nav-inner">
        {items.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined}>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
