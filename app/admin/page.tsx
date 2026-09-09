import Link from 'next/link'
import { displayName, requireProfile } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

type Search = Record<string, string | string[] | undefined>

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const profile = await requireProfile()
  const params = await searchParams
  const denied = params.denied

  const supabase = await createClient()
  const office = profile.role === 'office'

  const [activeJobs, pendingMedia, openChangeOrders] = await Promise.all([
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'upcoming']),
    supabase
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('change_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['new', 'acknowledged']),
  ])

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Howdy, {displayName(profile).split(' ')[0]}</h1>
          <p>
            {office
              ? 'Office view — you can create jobs, approve photos and work change orders.'
              : 'Field view — pull up a job, send in photos, flag a change to the office.'}
          </p>
        </div>
      </div>

      {denied ? (
        <div className="adm-note adm-note-warn adm-mb">
          <strong>Office only.</strong> That page is limited to office staff. If
          you need it, ask Heather to change your access.
        </div>
      ) : null}

      <div className="adm-stack">
        <Link href="/admin/upload" className="adm-btn adm-btn-primary adm-btn-block">
          Upload jobsite photos or video
        </Link>
        <Link href="/admin/change-orders/new" className="adm-btn adm-btn-block">
          Flag a change to the office
        </Link>
        <Link href="/admin/jobs" className="adm-btn adm-btn-block">
          Look up a job
        </Link>
      </div>

      <div className="adm-grid adm-grid-3 adm-mt-lg">
        <div className="adm-card">
          <h3>{activeJobs.count ?? 0}</h3>
          <p className="adm-small adm-muted">Active &amp; upcoming jobs</p>
        </div>
        <div className="adm-card">
          <h3>{pendingMedia.count ?? 0}</h3>
          <p className="adm-small adm-muted">
            {office ? 'Photos waiting on your review' : 'Of your uploads still pending'}
          </p>
        </div>
        <div className="adm-card">
          <h3>{openChangeOrders.count ?? 0}</h3>
          <p className="adm-small adm-muted">
            {office ? 'Change orders to work' : 'Of your change orders still open'}
          </p>
        </div>
      </div>

      {office ? (
        <div className="adm-stack adm-mt-lg">
          <Link href="/admin/media" className="adm-btn adm-btn-block">
            Review the photo queue
          </Link>
          <Link href="/admin/jobs/new" className="adm-btn adm-btn-block">
            Add a new job
          </Link>
          <Link href="/admin/crews" className="adm-btn adm-btn-block">
            Crew schedule &amp; calendar links
          </Link>
        </div>
      ) : null}

      <div className="adm-note adm-mt-lg">
        <strong>Nothing you upload goes public on its own.</strong> Photos and
        video sit in a review queue until someone in the office approves them.
      </div>
    </>
  )
}
