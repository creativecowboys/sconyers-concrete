import type { Metadata } from 'next'
import Link from 'next/link'
import { displayName, getProfile } from '@/lib/admin/auth'
import AdminNav from './_components/AdminNav'
import { signOut } from './_actions/session'
import './admin.css'

export const metadata: Metadata = {
  title: { absolute: 'Sconyers Concrete — Staff Admin' },
  // Never index the admin. Reinforced by app/robots.ts and by the
  // X-Robots-Tag header proxy.ts sets on every /admin response.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

// Every admin route reads cookies and live data. Nothing here is ever static.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  return (
    <div className="adm">
      <header className="adm-header">
        <div className="adm-header-row">
          <Link href="/admin" className="adm-brand">
            <span>SCONYERS</span>
            <small>Staff Admin</small>
          </Link>

          {profile ? (
            <div className="adm-whoami">
              <strong>{displayName(profile)}</strong>
              {profile.role === 'office' ? 'Office' : 'Field crew'}
              {' · '}
              <form action={signOut} style={{ display: 'inline' }}>
                <button
                  type="submit"
                  style={{
                    background: 'none',
                    border: 0,
                    padding: 0,
                    font: 'inherit',
                    color: '#ff8f8f',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>

      {profile ? <AdminNav role={profile.role} /> : null}

      <main className="adm-main">{children}</main>
    </div>
  )
}
