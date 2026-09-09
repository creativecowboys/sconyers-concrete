import Link from 'next/link'
import { requireOffice } from '@/lib/admin/auth'
import { formatBytes, formatDate, formatDateTime } from '@/lib/admin/format'
import {
  MEDIA_DESTINATION_LABELS,
  type MediaItem,
  type MediaStatus,
} from '@/lib/admin/types'
import { MEDIA_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import SubmitButton from '../_components/SubmitButton'
import { approveMedia, rejectMedia } from './actions'

type Search = Record<string, string | string[] | undefined>

const TABS: { value: MediaStatus; label: string }[] = [
  { value: 'pending', label: 'Waiting' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default async function MediaQueuePage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  await requireOffice()
  const params = await searchParams
  const raw = Array.isArray(params.status) ? params.status[0] : params.status
  const status: MediaStatus =
    raw === 'approved' || raw === 'rejected' ? raw : 'pending'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(60)

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
          <h1>Photo review</h1>
          <p>
            Everything the field sends lands here first. Approving marks it
            cleared to use — it does not publish anything on its own.
          </p>
        </div>
      </div>

      <div className="adm-btn-row adm-mb">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/media?status=${tab.value}`}
            className={
              tab.value === status
                ? 'adm-btn adm-btn-sm adm-btn-primary'
                : 'adm-btn adm-btn-sm'
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="adm-note adm-note-warn adm-mb">
        <strong>Google posting is still blocked.</strong> The Sconyers Business
        Profile went back to unverified when the address moved to Strawn Rd, and
        Google refuses every write until Heather or Chip records the
        verification video. Approve away — the queue keeps until it clears.
      </div>

      {error ? (
        <div className="adm-note adm-note-bad">
          <strong>Could not load the queue.</strong> {error.message}
        </div>
      ) : items.length === 0 ? (
        <div className="adm-empty">
          {status === 'pending' ? 'Nothing waiting. All caught up.' : `No ${status} media.`}
        </div>
      ) : (
        <div className="adm-stack">
          {items.map((item) => {
            const url = signed[item.storage_path]
            return (
              <div key={item.id} className="adm-card">
                <div className="adm-grid adm-grid-2">
                  <div>
                    {item.media_type === 'video' ? (
                      url ? (
                        <video className="adm-media-video" src={url} controls preload="metadata" />
                      ) : (
                        <div className="adm-thumb adm-thumb-fallback">Video preview unavailable</div>
                      )
                    ) : url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="adm-thumb"
                        src={url}
                        alt={item.caption ?? `${item.job_label}, ${item.scope ?? 'jobsite'}`}
                      />
                    ) : (
                      <div className="adm-thumb adm-thumb-fallback">Preview unavailable</div>
                    )}
                    {url ? (
                      <p className="adm-small adm-mt">
                        <a href={url} target="_blank" rel="noreferrer">
                          Open the original
                        </a>{' '}
                        <span className="adm-muted">
                          ({formatBytes(item.size_bytes)})
                        </span>
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <dl className="adm-dl">
                      <div>
                        <dt>Job</dt>
                        <dd>
                          {item.job_id ? (
                            <Link href={`/admin/jobs/${item.job_id}`}>{item.job_label}</Link>
                          ) : (
                            <>
                              {item.job_label}{' '}
                              <span className="adm-badge adm-badge-warn">not linked</span>
                            </>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Taken</dt>
                        <dd>{formatDate(item.captured_on)}</dd>
                      </div>
                      <div>
                        <dt>Where the field wants it</dt>
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
                      <div>
                        <dt>Uploaded</dt>
                        <dd>{formatDateTime(item.created_at)}</dd>
                      </div>
                      {item.review_note ? (
                        <div>
                          <dt>Review note</dt>
                          <dd className="adm-multiline">{item.review_note}</dd>
                        </div>
                      ) : null}
                    </dl>

                    {status === 'pending' ? (
                      <div className="adm-mt">
                        <form action={approveMedia} className="adm-mb">
                          <input type="hidden" name="id" value={item.id} />
                          <SubmitButton
                            className="adm-btn adm-btn-primary adm-btn-block"
                            pendingLabel="Approving…"
                          >
                            Approve
                          </SubmitButton>
                        </form>
                        <form action={rejectMedia}>
                          <input type="hidden" name="id" value={item.id} />
                          <label className="adm-field">
                            <span className="adm-field-label">
                              Reason (optional)
                              <span className="adm-field-hint">
                                Only the office sees this.
                              </span>
                            </span>
                            <input type="text" name="review_note" />
                          </label>
                          <SubmitButton
                            className="adm-btn adm-btn-block"
                            pendingLabel="Rejecting…"
                          >
                            Reject
                          </SubmitButton>
                        </form>
                      </div>
                    ) : (
                      <form action={status === 'approved' ? rejectMedia : approveMedia} className="adm-mt">
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton className="adm-btn adm-btn-block" pendingLabel="Saving…">
                          {status === 'approved' ? 'Undo — send back' : 'Approve after all'}
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
