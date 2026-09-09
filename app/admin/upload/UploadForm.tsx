'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatBytes } from '@/lib/admin/format'
import {
  GBP_VIDEO_LIMITS,
  MEDIA_DESTINATIONS,
  MEDIA_DESTINATION_LABELS,
  type MediaDestination,
} from '@/lib/admin/types'
import { MEDIA_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'

export type JobOption = { id: string; name: string }

/**
 * Fields that are sticky between uploads. A crew photographing a slab will not
 * retype the city and the GC every time, so the last answers come back
 * pre-filled and they only touch what changed.
 */
type StickyPrefs = {
  city: string
  county: string
  scope: string
  gcName: string
  gcNamePublic: boolean
  destination: MediaDestination
  jobLabel: string
}

const PREFS_KEY = 'sconyers.upload.prefs.v1'

const EMPTY_PREFS: StickyPrefs = {
  city: '',
  county: '',
  scope: '',
  gcName: '',
  gcNamePublic: false,
  destination: 'internal',
  jobLabel: '',
}

function readPrefs(): StickyPrefs {
  if (typeof window === 'undefined') return EMPTY_PREFS
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return EMPTY_PREFS
    return { ...EMPTY_PREFS, ...(JSON.parse(raw) as Partial<StickyPrefs>) }
  } catch {
    return EMPTY_PREFS
  }
}

function writePrefs(prefs: StickyPrefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private browsing, or storage disabled. Sticky fields are a convenience.
  }
}

/** Storage keys must be plain ASCII; phone filenames often are not. */
function safeName(name: string) {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-60)
  return cleaned || 'upload'
}

/** Reads a local video's length without uploading it first. */
function videoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    const done = (value: number | null) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null)
    video.onerror = () => done(null)
    video.src = url
  })
}

type Status =
  | { kind: 'idle' }
  | { kind: 'uploading'; done: number; total: number; label: string }
  | { kind: 'done'; count: number }
  | { kind: 'error'; message: string }

export default function UploadForm({
  jobs,
  today,
  initialJobId,
  profileId,
}: {
  jobs: JobOption[]
  today: string
  initialJobId?: string
  profileId: string
}) {
  const [prefs, setPrefs] = useState<StickyPrefs>(EMPTY_PREFS)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [jobLabel, setJobLabel] = useState('')
  const [capturedOn, setCapturedOn] = useState(today)
  const [files, setFiles] = useState<File[]>([])
  const [videoInfo, setVideoInfo] = useState<{ name: string; seconds: number | null; bytes: number }[]>([])
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sticky fields load after mount so the server and client markup match.
  useEffect(() => {
    const stored = readPrefs()
    setPrefs(stored)
    const preselected = initialJobId ? jobs.find((job) => job.id === initialJobId) : undefined
    setJobLabel(preselected?.name ?? stored.jobLabel)
    setPrefsLoaded(true)
  }, [initialJobId, jobs])

  const matchedJob = useMemo(
    () => jobs.find((job) => job.name.toLowerCase() === jobLabel.trim().toLowerCase()),
    [jobs, jobLabel]
  )

  const oversizeVideo = videoInfo.some(
    (info) => info.bytes > GBP_VIDEO_LIMITS.megabytes * 1024 * 1024
  )
  const longVideo = videoInfo.some(
    (info) => info.seconds !== null && info.seconds > GBP_VIDEO_LIMITS.seconds
  )

  async function onFilesPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    setFiles(picked)
    setStatus({ kind: 'idle' })

    const videos = picked.filter((file) => file.type.startsWith('video/'))
    const info = await Promise.all(
      videos.map(async (file) => ({
        name: file.name,
        bytes: file.size,
        seconds: await videoDuration(file),
      }))
    )
    setVideoInfo(info)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!jobLabel.trim()) {
      setStatus({ kind: 'error', message: 'Pick or type a job first.' })
      return
    }
    if (files.length === 0) {
      setStatus({ kind: 'error', message: 'Choose at least one photo or video.' })
      return
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus({
        kind: 'error',
        message:
          'No signal right now. Your pictures are still on your phone — try again when you have a bar or two.',
      })
      return
    }

    const supabase = createClient()
    let done = 0

    for (const file of files) {
      setStatus({ kind: 'uploading', done, total: files.length, label: file.name })

      const isVideo = file.type.startsWith('video/')
      const path = `${profileId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(file.name)}`

      // Straight to Supabase Storage from the phone. Nothing goes through a
      // Vercel function, so a 90 MB walkthrough video is not a problem.
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false })

      if (uploadError) {
        setStatus({
          kind: 'error',
          message: `${file.name} did not go up: ${uploadError.message}. ${
            done > 0 ? `${done} file${done === 1 ? '' : 's'} did make it.` : ''
          }`,
        })
        return
      }

      const { error: rowError } = await supabase.from('media_items').insert({
        job_id: matchedJob?.id ?? null,
        job_label: jobLabel.trim(),
        captured_on: capturedOn,
        media_type: isVideo ? 'video' : 'photo',
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        original_name: file.name,
        city: prefs.city.trim() || null,
        county: prefs.county.trim() || null,
        scope: prefs.scope.trim() || null,
        gc_name: prefs.gcName.trim() || null,
        gc_name_public: prefs.gcNamePublic,
        destination: prefs.destination,
        // google_status is set by a trigger from `destination`, so the queue is
        // right however the row got here. Don't send it from the browser.
        uploaded_by: profileId,
      })

      if (rowError) {
        setStatus({
          kind: 'error',
          message: `${file.name} uploaded but did not get tagged: ${rowError.message}. Tell the office.`,
        })
        return
      }

      done += 1
    }

    writePrefs({ ...prefs, jobLabel: jobLabel.trim() })
    setFiles([])
    setVideoInfo([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    setStatus({ kind: 'done', count: done })
  }

  const uploading = status.kind === 'uploading'

  return (
    <form onSubmit={onSubmit}>
      {status.kind === 'done' ? (
        <div className="adm-note adm-note-ok adm-mb">
          <strong>
            {status.count} file{status.count === 1 ? '' : 's'} sent in.
          </strong>{' '}
          They are on file and everyone can see them. Anything you marked for
          the Google listing is queued for the office to push.
        </div>
      ) : null}

      {status.kind === 'error' ? (
        <div className="adm-note adm-note-bad adm-mb">{status.message}</div>
      ) : null}

      {/* ── The two required fields, and nothing else above the fold. ── */}
      <div className="adm-card">
        <label className="adm-field">
          <span className="adm-field-label">
            Job <span className="adm-req">*</span>
            <span className="adm-field-hint">
              Start typing — it suggests jobs already in the system. A new name
              is fine too.
            </span>
          </span>
          <input
            type="text"
            name="job"
            list="job-options"
            value={jobLabel}
            onChange={(event) => setJobLabel(event.target.value)}
            autoCapitalize="words"
            autoComplete="off"
            required
          />
          <datalist id="job-options">
            {jobs.map((job) => (
              <option key={job.id} value={job.name} />
            ))}
          </datalist>
        </label>

        {jobLabel.trim() && !matchedJob ? (
          <div className="adm-note adm-small" style={{ marginTop: '-0.4rem' }}>
            New job name. That is fine — the office will tie it to a job later.
          </div>
        ) : null}

        <label className="adm-field adm-mt">
          <span className="adm-field-label">
            Date taken <span className="adm-req">*</span>
          </span>
          <input
            type="date"
            name="captured_on"
            value={capturedOn}
            onChange={(event) => setCapturedOn(event.target.value)}
            required
          />
        </label>

        <label className="adm-field">
          <span className="adm-field-label">
            Photos or video <span className="adm-req">*</span>
            <span className="adm-field-hint">You can pick more than one.</span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={onFilesPicked}
          />
        </label>

        {files.length > 0 ? (
          <p className="adm-small adm-muted">
            {files.length} file{files.length === 1 ? '' : 's'} ready ·{' '}
            {formatBytes(files.reduce((total, file) => total + file.size, 0))}
          </p>
        ) : null}
      </div>

      {/* ── Google's video limits, said out loud before they hit send. ── */}
      {videoInfo.length > 0 ? (
        <div
          className={
            oversizeVideo || longVideo
              ? 'adm-note adm-note-warn adm-mt'
              : 'adm-note adm-mt'
          }
        >
          <strong>Video and Google.</strong> Google Business Profile only takes
          video up to {GBP_VIDEO_LIMITS.seconds} seconds,{' '}
          {GBP_VIDEO_LIMITS.megabytes} MB and {GBP_VIDEO_LIMITS.resolution} or
          better.
          <ul style={{ margin: '0.5rem 0 0 1.1rem' }}>
            {videoInfo.map((info) => {
              const tooBig = info.bytes > GBP_VIDEO_LIMITS.megabytes * 1024 * 1024
              const tooLong = info.seconds !== null && info.seconds > GBP_VIDEO_LIMITS.seconds
              return (
                <li key={info.name}>
                  {info.name} — {formatBytes(info.bytes)}
                  {info.seconds !== null ? `, ${Math.round(info.seconds)}s` : ''}
                  {tooBig || tooLong ? ' — over Google’s limit' : ' — fine for Google'}
                </li>
              )
            })}
          </ul>
          {oversizeVideo || longVideo ? (
            <p style={{ marginTop: '0.5rem' }}>
              Send it anyway — it still works for the website gallery. The office
              will trim a short clip for Google if they want one.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Everything optional, folded away and sticky. ── */}
      <details className="adm-card adm-mt">
        <summary style={{ cursor: 'pointer', fontWeight: 650, minHeight: '32px' }}>
          Add detail (optional — remembered for next time)
        </summary>

        <div className="adm-mt">
          <div className="adm-grid adm-grid-2">
            <label className="adm-field">
              <span className="adm-field-label">City</span>
              <input
                type="text"
                value={prefs.city}
                onChange={(event) => setPrefs({ ...prefs, city: event.target.value })}
                autoCapitalize="words"
              />
            </label>
            <label className="adm-field">
              <span className="adm-field-label">County</span>
              <input
                type="text"
                value={prefs.county}
                onChange={(event) => setPrefs({ ...prefs, county: event.target.value })}
                autoCapitalize="words"
              />
            </label>
          </div>

          <label className="adm-field">
            <span className="adm-field-label">
              Scope
              <span className="adm-field-hint">
                Slab, parking field, truck court, foundation, ADA ramp…
              </span>
            </span>
            <input
              type="text"
              value={prefs.scope}
              onChange={(event) => setPrefs({ ...prefs, scope: event.target.value })}
            />
          </label>

          <label className="adm-field">
            <span className="adm-field-label">General contractor</span>
            <input
              type="text"
              value={prefs.gcName}
              onChange={(event) => setPrefs({ ...prefs, gcName: event.target.value })}
              autoCapitalize="words"
            />
          </label>

          <label className="adm-check adm-mb">
            <input
              type="checkbox"
              checked={prefs.gcNamePublic}
              onChange={(event) =>
                setPrefs({ ...prefs, gcNamePublic: event.target.checked })
              }
            />
            <span>
              OK to name the contractor publicly
              <small>
                Leave this off unless they have said yes. Without it we use the
                job but not their name.
              </small>
            </span>
          </label>

          <label className="adm-field">
            <span className="adm-field-label">
              Where should this go?
              <span className="adm-field-hint">
                Pick Google or Both and it queues for the listing.
              </span>
            </span>
            <select
              value={prefs.destination}
              onChange={(event) =>
                setPrefs({ ...prefs, destination: event.target.value as MediaDestination })
              }
            >
              {MEDIA_DESTINATIONS.map((value) => (
                <option key={value} value={value}>
                  {MEDIA_DESTINATION_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <div className="adm-mt">
        {uploading ? (
          <>
            <div className="adm-progress adm-mb">
              <span
                style={{
                  width: `${Math.round(((status.done + 0.5) / status.total) * 100)}%`,
                }}
              />
            </div>
            <p className="adm-small adm-muted adm-mb">
              Sending {status.done + 1} of {status.total} — {status.label}. Keep
              this page open.
            </p>
          </>
        ) : null}

        <button
          type="submit"
          className="adm-btn adm-btn-primary adm-btn-block"
          disabled={uploading || !prefsLoaded}
        >
          {uploading ? 'Sending…' : 'Send them in'}
        </button>
      </div>
    </form>
  )
}
