import Link from 'next/link'
import { JobJump } from './JobJump'
import { requireProfile } from '@/lib/admin/auth'
import { formatDate } from '@/lib/admin/format'
import { JOB_STATUS_LABELS, type Job } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'

type Search = Record<string, string | string[] | undefined>

function badgeClass(status: Job['status']) {
  if (status === 'active') return 'adm-badge adm-badge-ok'
  if (status === 'on_hold') return 'adm-badge adm-badge-bad'
  if (status === 'complete') return 'adm-badge'
  return 'adm-badge adm-badge-warn'
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const profile = await requireProfile()
  const params = await searchParams
  const showAll = (Array.isArray(params.all) ? params.all[0] : params.all) === '1'

  const supabase = await createClient()
  let request = supabase
    .from('jobs')
    .select(
      'id, name, client_name, address, city, county, status, start_date, end_date, notes, created_at, updated_at'
    )
    .order('status')
    .order('start_date', { ascending: false, nullsFirst: false })
    .limit(200)

  if (!showAll) request = request.in('status', ['bidding', 'upcoming', 'active', 'on_hold'])

  const { data, error } = await request
  const jobs = (data ?? []) as Job[]

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Jobs</h1>
          <p>
            {profile.role === 'office'
              ? 'Every job in the system. Tap one to see the detail or edit it.'
              : 'Read-only. Tap a job to see the address, dates and notes.'}
          </p>
        </div>
        {profile.role === 'office' ? (
          <Link href="/admin/jobs/new" className="adm-btn adm-btn-primary">
            New job
          </Link>
        ) : null}
      </div>

      <div className="adm-card adm-mb">
        <JobJump jobs={jobs.map((job) => ({ id: job.id, name: job.name }))} />
        <div className="adm-btn-row adm-mt">
          <Link
            href={showAll ? '/admin/jobs' : '/admin/jobs?all=1'}
            className="adm-btn adm-btn-sm"
          >
            {showAll ? 'Hide finished jobs' : 'Show finished jobs'}
          </Link>
        </div>
      </div>

      {error ? (
        <div className="adm-note adm-note-bad">
          <strong>Could not load jobs.</strong> {error.message}
        </div>
      ) : jobs.length === 0 ? (
        <div className="adm-empty">
          {profile.role === 'office' ? (
            <>
              No jobs yet. <Link href="/admin/jobs/new">Add the first one.</Link>
            </>
          ) : (
            <>No jobs on the board yet. The office adds them.</>
          )}
        </div>
      ) : (
        <div className="adm-stack">
          {jobs.map((job) => (
            <Link key={job.id} href={`/admin/jobs/${job.id}`} className="adm-row">
              <div className="adm-row-title">
                <span>{job.name}</span>
                <span className={badgeClass(job.status)}>
                  {JOB_STATUS_LABELS[job.status]}
                </span>
              </div>
              <div className="adm-row-meta">
                {[job.client_name, [job.city, job.county && `${job.county} County`]
                  .filter(Boolean)
                  .join(', ')]
                  .filter(Boolean)
                  .join(' · ') || 'No contractor or location on file'}
              </div>
              {job.start_date ? (
                <div className="adm-row-meta">Starts {formatDate(job.start_date)}</div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
