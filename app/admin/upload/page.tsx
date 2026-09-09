import Link from 'next/link'
import { requireProfile } from '@/lib/admin/auth'
import { formatDate, todayInGeorgia } from '@/lib/admin/format'
import { createClient } from '@/lib/supabase/server'
import UploadForm, { type JobOption } from './UploadForm'

type Search = Record<string, string | string[] | undefined>

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const profile = await requireProfile()
  const params = await searchParams
  const jobParam = Array.isArray(params.job) ? params.job[0] : params.job

  const supabase = await createClient()

  const [{ data: jobs }, { data: recent }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, name')
      .in('status', ['bidding', 'upcoming', 'active', 'on_hold'])
      .order('name')
      .limit(300),
    supabase
      .from('media_items')
      .select('id, job_label, captured_on, media_type, status')
      .eq('uploaded_by', profile.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Send in photos</h1>
          <p>
            Two things are required: which job, and the day it was taken.
            Everything else is optional and gets remembered for next time.
          </p>
        </div>
      </div>

      <UploadForm
        jobs={(jobs ?? []) as JobOption[]}
        today={todayInGeorgia()}
        initialJobId={jobParam}
        profileId={profile.id}
      />

      {(recent ?? []).length > 0 ? (
        <>
          <h2 className="adm-mt-lg adm-mb">Your last few uploads</h2>
          <div className="adm-stack">
            {(recent ?? []).map((item) => (
              <div key={item.id} className="adm-row">
                <div className="adm-row-title">
                  <span>
                    {item.job_label} — {item.media_type === 'video' ? 'video' : 'photo'}
                  </span>
                  <span
                    className={
                      item.status === 'approved'
                        ? 'adm-badge adm-badge-ok'
                        : item.status === 'rejected'
                          ? 'adm-badge adm-badge-bad'
                          : 'adm-badge adm-badge-warn'
                    }
                  >
                    {item.status === 'pending' ? 'waiting' : item.status}
                  </span>
                </div>
                <div className="adm-row-meta">Taken {formatDate(item.captured_on)}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {profile.role === 'office' ? (
        <p className="adm-mt-lg">
          <Link href="/admin/media">Go to the review queue →</Link>
        </p>
      ) : null}
    </>
  )
}
