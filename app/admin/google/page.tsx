import Link from 'next/link'
import { requireOffice } from '@/lib/admin/auth'
import { formatDate, formatDateTime } from '@/lib/admin/format'
import {
  GBP_VIDEO_LIMITS,
  type GoogleStatus,
  type MediaItem,
} from '@/lib/admin/types'
import { MEDIA_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import SubmitButton from '../_components/SubmitButton'
import { markPosted, requeueForGoogle, saveCaption, skipGoogle } from './actions'

type Search = Record<string, string | string[] | undefined>

const TABS: { value: GoogleStatus; label: string }[] = [
  { value: 'queued', label: 'Waiting' },
  { value: 'posted', label: 'Posted' },
  { value: 'skipped', label: 'Skipped' },
]

export default async function GoogleQueuePage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  await requireOffice()

  const params = await searchParams
  const raw = Array.isArray(params.status) ? params.status[0] : params.status
  const status: GoogleStatus = raw === 'posted' || raw === 'skipped' ? raw : 'queued'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('google_status', status)
    .order('created_at', { ascending: false })
    .limit(60)

  const items = (data ?? []) as MediaItem[]

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
          <h1>Google listing queue</h1>
          <p>
            Anything the crew marked for the Google listing lands here. One
            upload, two places — the picture stays in the library and it lines
            up for the Business Profile at the same time.
          </p>
        </div>
      </div>

      {/* The honest version of "why is the button greyed out". */}
      <div className="adm-note adm-note-warn adm-mb">
        <strong>Posting to Google is switched off, and it is not a bug.</strong>{' '}
        The Sconyers Business Profile went back to unverified when the address
        moved to 2290 Strawn Rd, and Google refuses every change to the listing
        — photos included — until someone records the verification video there.
        Nothing is lost in the meantime: everything below keeps until it clears,
        and then it goes up in one pass.
      </div>

      <div className="adm-btn-row adm-mb">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/google?status=${tab.value}`}
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

      {error ? (
        <div className="adm-note adm-note-bad">
          <strong>Could not load the queue.</strong> {error.message}
        </div>
      ) : items.length === 0 ? (
        <div className="adm-empty">
          {status === 'queued' ? (
            <>
              Nothing waiting on Google. Anything uploaded with
              &ldquo;Google listing&rdquo; or &ldquo;Both&rdquo; shows up here.{' '}
              <Link href="/admin/media">Photo library →</Link>
            </>
          ) : (
            `Nothing ${status}.`
          )}
        </div>
      ) : (
        <div className="adm-stack">
          {items.map((item) => {
            const url = signed[item.storage_path]
            const oversizeVideo =
              item.media_type === 'video' &&
              (item.size_bytes ?? 0) > GBP_VIDEO_LIMITS.megabytes * 1024 * 1024

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
                        alt={item.caption ?? `${item.job_label}, ${item.scope ?? 'jobsite'}`}
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
                        </a>
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
                            item.job_label
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Taken</dt>
                        <dd>{formatDate(item.captured_on)}</dd>
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
                      {item.google_posted_at ? (
                        <div>
                          <dt>Posted</dt>
                          <dd>{formatDateTime(item.google_posted_at)}</dd>
                        </div>
                      ) : null}
                      {item.google_error ? (
                        <div>
                          <dt>Last error</dt>
                          <dd className="adm-multiline">{item.google_error}</dd>
                        </div>
                      ) : null}
                    </dl>

                    {item.gc_name && !item.gc_name_public ? (
                      <div className="adm-note adm-note-bad adm-mb">
                        <strong>Do not name {item.gc_name}.</strong> The crew did
                        not tick &ldquo;OK to name the contractor publicly&rdquo;
                        on this one. Describe the work, not the client.
                      </div>
                    ) : null}

                    {oversizeVideo ? (
                      <div className="adm-note adm-note-warn adm-mb">
                        <strong>Too big for Google.</strong> The listing takes
                        video up to {GBP_VIDEO_LIMITS.seconds} seconds,{' '}
                        {GBP_VIDEO_LIMITS.megabytes} MB and{' '}
                        {GBP_VIDEO_LIMITS.resolution}. This one needs trimming
                        first, or skip it and use a still.
                      </div>
                    ) : null}

                    {/* Written now so the queue is ready to push, not a pile of
                        untitled photos nobody remembers by the time it clears. */}
                    <form action={saveCaption} className="adm-mb">
                      <input type="hidden" name="id" value={item.id} />
                      <label className="adm-field">
                        <span className="adm-field-label">
                          Caption for Google
                          <span className="adm-field-hint">
                            What the post will say. Plain and specific beats
                            clever — the scope, the city, the size.
                          </span>
                        </span>
                        <textarea name="caption" rows={3} defaultValue={item.caption ?? ''} />
                      </label>
                      <SubmitButton className="adm-btn adm-btn-sm" pendingLabel="Saving…">
                        Save caption
                      </SubmitButton>
                    </form>

                    <button
                      type="button"
                      className="adm-btn adm-btn-block adm-mb"
                      disabled
                      title="Blocked until the Business Profile is verified at 2290 Strawn Rd."
                    >
                      Push to Google — blocked
                    </button>

                    {status === 'queued' ? (
                      <>
                        <form action={markPosted} className="adm-mb">
                          <input type="hidden" name="id" value={item.id} />
                          <SubmitButton
                            className="adm-btn adm-btn-primary adm-btn-block"
                            pendingLabel="Saving…"
                          >
                            Mark as posted
                          </SubmitButton>
                        </form>
                        <form action={skipGoogle}>
                          <input type="hidden" name="id" value={item.id} />
                          <SubmitButton
                            className="adm-btn adm-btn-block"
                            pendingLabel="Saving…"
                          >
                            Not for Google
                          </SubmitButton>
                        </form>
                        <p className="adm-small adm-muted adm-mt">
                          &ldquo;Mark as posted&rdquo; is for after Creative
                          Cowboys has pushed it. It does not post anything.
                        </p>
                      </>
                    ) : (
                      <form action={requeueForGoogle}>
                        <input type="hidden" name="id" value={item.id} />
                        <SubmitButton className="adm-btn adm-btn-block" pendingLabel="Saving…">
                          Put back in the queue
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
