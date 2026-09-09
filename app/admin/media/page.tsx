import Link from 'next/link'
import { requireProfile } from '@/lib/admin/auth'
import { formatBytes, formatDate, formatDateTime } from '@/lib/admin/format'
import {
  GOOGLE_STATUS_LABELS,
  MEDIA_DESTINATION_LABELS,
  type MediaItem,
} from '@/lib/admin/types'
import { MEDIA_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import SubmitButton from '../_components/SubmitButton'
import { deleteMedia } from './actions'

type Search = Record<string, string | string[] | undefined>

const PAGE_SIZE = 60

function one(params: Search, key: string) {
  const value = params[key]
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ''
}

function googleBadgeClass(status: MediaItem['google_status']) {
  if (status === 'posted') return 'adm-badge adm-badge-ok'
  if (status === 'queued') return 'adm-badge adm-badge-warn'
  return 'adm-badge'
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  // Everyone signed in sees the whole library. One crew, one shared set of
  // pictures — the office/field split on viewing went with the review queue.
  const profile = await requireProfile()
  const office = profile.role === 'office'

  const params = await searchParams
  const job = one(params, 'job')

  const supabase = await createClient()

  // The job filter is built from what has actually been uploaded, not from the
  // jobs table — plenty of media carries a free-text job name the office has
  // not linked to a job row yet.
  const { data: labelRows } = await supabase
    .from('media_items')
    .select('job_label')
    .order('job_label')
    .limit(1000)

  const jobLabels = Array.from(
    new Set(((labelRows ?? []) as { job_label: string }[]).map((row) => row.job_label))
  ).sort((a, b) => a.localeCompare(b))

  let request = supabase
    .from('media_items')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (job) request = request.eq('job_label', job)

  const { data, error } = await request
  const items = (data ?? []) as MediaItem[]

  // Short-lived signed URLs — the bucket is private, so nothing is reachable
  // without one, and these expire in half an hour.
  const signed: Record<string, string> = {}
  if (items.length > 0) {
    const { data: urls } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(
        items.map((item) => item.storage_path),
        60 * 30
      )
    for (const entry of urls ?? []) {
      if (entry.path && entry.signedUrl) signed[entry.path] = entry.signedUrl
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Photo library</h1>
          <p>
            Every photo and video the crew has sent in, newest first. Nothing
            waits on approval — what you upload is on file straight away.
          </p>
        </div>
        <Link href="/admin/upload" className="adm-btn adm-btn-primary">
          Add photos
        </Link>
      </div>

      {jobLabels.length > 0 ? (
        <form className="adm-card adm-mb" action="/admin/media">
          <label className="adm-field" style={{ marginBottom: '0.75rem' }}>
            <span className="adm-field-label">Job</span>
            <select name="job" defaultValue={job}>
              <option value="">All jobs</option>
              {jobLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="adm-btn-row">
            <button type="submit" className="adm-btn adm-btn-sm adm-btn-primary">
              Show these
            </button>
            {job ? (
              <Link href="/admin/media" className="adm-btn adm-btn-sm">
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      ) : null}

      {error ? (
        <div className="adm-note adm-note-bad">
          <strong>Could not load the library.</strong> {error.message}
        </div>
      ) : items.length === 0 ? (
        <div className="adm-empty">
          {job ? (
            <>
              Nothing on file for &ldquo;{job}&rdquo;.{' '}
              <Link href="/admin/media">Show everything</Link>
            </>
          ) : (
            <>
              No photos yet.{' '}
              <Link href="/admin/upload">Send the first ones in.</Link>
            </>
          )}
        </div>
      ) : (
        <>
          <p className="adm-small adm-muted adm-mb">
            {items.length === PAGE_SIZE
              ? `Showing the newest ${PAGE_SIZE}. Filter by job to see further back.`
              : `${items.length} file${items.length === 1 ? '' : 's'} on file${
                  job ? ' for this job' : ''
                }.`}
          </p>

          <div className="adm-stack">
            {items.map((item) => {
              const url = signed[item.storage_path]
              return (
                <div key={item.id} className="adm-card">
                  <div className="adm-grid adm-grid-2">
                    <div>
                      {item.media_type === 'video' ? (
                        url ? (
                          <video
                            className="adm-media-video"
                            src={url}
                            controls
                            preload="metadata"
                          />
                        ) : (
                          <div className="adm-thumb adm-thumb-fallback">
                            Video preview unavailable
                          </div>
                        )
                      ) : url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="adm-thumb"
                          src={url}
                          alt={
                            item.caption ??
                            `${item.job_label}, ${item.scope ?? 'jobsite'}`
                          }
                        />
                      ) : (
                        <div className="adm-thumb adm-thumb-fallback">
                          Preview unavailable
                        </div>
                      )}
                      {url ? (
                        <p className="adm-small adm-mt">
                          <a href={url} target="_blank" rel="noreferrer">
                            Open the original
                          </a>{' '}
                          <span className="adm-muted">({formatBytes(item.size_bytes)})</span>
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <div className="adm-row-title adm-mb">
                        <span>
                          {item.job_id ? (
                            <Link href={`/admin/jobs/${item.job_id}`}>{item.job_label}</Link>
                          ) : (
                            item.job_label
                          )}
                        </span>
                        <span className={googleBadgeClass(item.google_status)}>
                          {GOOGLE_STATUS_LABELS[item.google_status]}
                        </span>
                      </div>

                      <dl className="adm-dl">
                        <div>
                          <dt>Taken</dt>
                          <dd>{formatDate(item.captured_on)}</dd>
                        </div>
                        <div>
                          <dt>Meant for</dt>
                          <dd>{MEDIA_DESTINATION_LABELS[item.destination]}</dd>
                        </div>
                        {item.scope || item.city || item.county ? (
                          <div>
                            <dt>Detail</dt>
                            <dd>
                              {[item.scope, item.city, item.county && `${item.county} County`]
                                .filter(Boolean)
                                .join(' · ')}
                            </dd>
                          </div>
                        ) : null}
                        <div>
                          <dt>Contractor</dt>
                          <dd>
                            {item.gc_name ? (
                              <>
                                {item.gc_name}{' '}
                                {item.gc_name_public ? (
                                  <span className="adm-badge adm-badge-ok">OK to name</span>
                                ) : (
                                  <span className="adm-badge adm-badge-bad">do not name</span>
                                )}
                              </>
                            ) : (
                              '—'
                            )}
                          </dd>
                        </div>
                        {item.caption ? (
                          <div>
                            <dt>Caption</dt>
                            <dd className="adm-multiline">{item.caption}</dd>
                          </div>
                        ) : null}
                        <div>
                          <dt>Sent in</dt>
                          <dd>{formatDateTime(item.created_at)}</dd>
                        </div>
                      </dl>

                      {office ? (
                        <form action={deleteMedia} className="adm-mt">
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="storage_path"
                            value={item.storage_path}
                          />
                          <SubmitButton
                            className="adm-btn adm-btn-block"
                            pendingLabel="Deleting…"
                            confirm={`Delete this ${item.media_type} from ${item.job_label}? It cannot be undone.`}
                          >
                            Delete this file
                          </SubmitButton>
                          <p className="adm-small adm-muted adm-mt">
                            Deleting removes the file for good. Office only.
                          </p>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
