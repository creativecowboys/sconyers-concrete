import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/admin/auth'
import { formatDate, formatDateTime } from '@/lib/admin/format'
import {
  CHANGE_ORDER_STATUS_LABELS,
  GOOGLE_STATUS_LABELS,
  JOB_STATUS_LABELS,
  type ChangeOrder,
  type Job,
  type MediaItem,
} from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'

type Search = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Search>
}) {
  const { id } = await params
  const search = await searchParams
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select(
      'id, name, client_name, address, city, county, status, start_date, end_date, crew_id, notes, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle<Job>()

  if (!job) notFound()

  const { data: crew } = job.crew_id
    ? await supabase.from('crews').select('name').eq('id', job.crew_id).maybeSingle<{ name: string }>()
    : { data: null }
  const crewLabel = crew?.name ?? (job.crew_id ? 'Crew assigned' : null)

  // Set by the save action: how the crew calendar came out of that save.
  const scheduled = Number(first(search.scheduled))
  const scheduleProblem = first(search.schedule)

  // RLS already limits the field to their own rows, so these queries are safe
  // to run for both roles without a role branch.
  const [{ data: media }, { data: changeOrders }] = await Promise.all([
    supabase
      .from('media_items')
      .select('id, job_label, captured_on, media_type, google_status, scope, created_at')
      .eq('job_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('change_orders')
      .select('id, job_label, description, status, raised_by_name, created_at')
      .eq('job_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const location = [job.address, job.city, job.county && `${job.county} County`]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <div className="adm-page-head">
        <div>
          <p className="adm-small adm-muted">
            <Link href="/admin/jobs">← All jobs</Link>
          </p>
          <h1>{job.name}</h1>
          <p>
            <span className="adm-badge">{JOB_STATUS_LABELS[job.status]}</span>
          </p>
        </div>
        {profile.role === 'office' ? (
          <Link href={`/admin/jobs/${job.id}/edit`} className="adm-btn adm-btn-sm">
            Edit
          </Link>
        ) : null}
      </div>

      {Number.isFinite(scheduled) && first(search.scheduled) !== undefined ? (
        <div className={`adm-note ${scheduled > 0 ? 'adm-note-ok' : 'adm-note-warn'} adm-mb`}>
          {scheduled > 0 ? (
            <>
              <strong>{crewLabel ?? 'The crew'}</strong> is on the calendar for{' '}
              {scheduled} working {scheduled === 1 ? 'day' : 'days'}.
            </>
          ) : (
            <>No weekdays between those dates, so nothing went on the calendar.</>
          )}
        </div>
      ) : null}
      {scheduleProblem ? (
        <div className="adm-note adm-note-warn adm-mb">
          <strong>The job saved, but the crew calendar did not.</strong>{' '}
          {scheduleProblem === 'too-long'
            ? 'That is more than a year of working days — check the finish date.'
            : 'Put the crew on the schedule from the Crews page, or edit the job and save again.'}
        </div>
      ) : null}

      <div className="adm-stack adm-mb">
        <Link
          href={`/admin/upload?job=${job.id}`}
          className="adm-btn adm-btn-primary adm-btn-block"
        >
          Upload photos or video for this job
        </Link>
        <Link
          href={`/admin/change-orders/new?job=${job.id}`}
          className="adm-btn adm-btn-block"
        >
          Flag a change on this job
        </Link>
      </div>

      <div className="adm-card">
        <dl className="adm-dl">
          <div>
            <dt>Contractor / client</dt>
            <dd>{job.client_name || '—'}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>
              {location ? (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {location}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Dates</dt>
            <dd>
              {formatDate(job.start_date)} → {formatDate(job.end_date)}
            </dd>
          </div>
          <div>
            <dt>Crew</dt>
            <dd>{crewLabel ?? '—'}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd className="adm-multiline">{job.notes || '—'}</dd>
          </div>
        </dl>
      </div>

      <h2 className="adm-mt-lg adm-mb">Recent media</h2>
      <p className="adm-small adm-mb">
        <Link href={`/admin/media?job=${encodeURIComponent(job.name)}`}>
          Everything on file for this job →
        </Link>
      </p>
      {(media ?? []).length === 0 ? (
        <div className="adm-empty">Nothing uploaded against this job yet.</div>
      ) : (
        <div className="adm-stack">
          {(media as Pick<
            MediaItem,
            'id' | 'captured_on' | 'media_type' | 'google_status' | 'scope'
          >[]).map((item) => (
            <div key={item.id} className="adm-row">
              <div className="adm-row-title">
                <span>
                  {item.media_type === 'video' ? 'Video' : 'Photo'}
                  {item.scope ? ` — ${item.scope}` : ''}
                </span>
                <span
                  className={
                    item.google_status === 'posted'
                      ? 'adm-badge adm-badge-ok'
                      : item.google_status === 'queued'
                        ? 'adm-badge adm-badge-warn'
                        : 'adm-badge'
                  }
                >
                  {GOOGLE_STATUS_LABELS[item.google_status]}
                </span>
              </div>
              <div className="adm-row-meta">Taken {formatDate(item.captured_on)}</div>
            </div>
          ))}
        </div>
      )}

      <h2 className="adm-mt-lg adm-mb">Changes flagged from the field</h2>
      {(changeOrders ?? []).length === 0 ? (
        <div className="adm-empty">Nothing flagged on this job.</div>
      ) : (
        <div className="adm-stack">
          {(changeOrders as Pick<
            ChangeOrder,
            'id' | 'description' | 'status' | 'raised_by_name' | 'created_at'
          >[]).map((order) => (
            <Link
              key={order.id}
              href={`/admin/change-orders/${order.id}`}
              className="adm-row"
            >
              <div className="adm-row-title">
                <span>{order.description.slice(0, 70)}</span>
                <span className="adm-badge">
                  {CHANGE_ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="adm-row-meta">
                {order.raised_by_name || 'Someone'} · {formatDateTime(order.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
