import Link from 'next/link'
import { displayName, requireProfile } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import type { JobOption } from '../../upload/UploadForm'
import ChangeOrderForm from './ChangeOrderForm'

type Search = Record<string, string | string[] | undefined>

export default async function NewChangeOrderPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const profile = await requireProfile()
  const params = await searchParams
  const jobParam = Array.isArray(params.job) ? params.job[0] : params.job

  const supabase = await createClient()
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, name')
    .in('status', ['bidding', 'upcoming', 'active', 'on_hold'])
    .order('name')
    .limit(300)

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Flag a change</h1>
          <p>
            Tell the office something changed on the job, while you are standing
            in it.
          </p>
        </div>
        <Link href="/admin/change-orders" className="adm-btn adm-btn-sm">
          Cancel
        </Link>
      </div>

      {/* Dave was explicit about this on Sep 9: internal capture only. The UI
          must never read as the official change order to the GC. */}
      <div className="adm-note adm-note-warn adm-mb">
        <strong>This is an internal note, not a change order to the GC.</strong>{' '}
        It gets the information off the jobsite and in front of the office. The
        office still writes and issues the actual change order to the general
        contractor — nothing you send here goes to them.
      </div>

      <ChangeOrderForm
        jobs={(jobs ?? []) as JobOption[]}
        initialJobId={jobParam}
        profileId={profile.id}
        raisedByName={displayName(profile)}
      />
    </>
  )
}
