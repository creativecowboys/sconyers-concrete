'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { JobOption } from '@/app/admin/upload/UploadForm'
import { MEDIA_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'

function safeName(name: string) {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-60)
  return cleaned || 'photo'
}

export default function ChangeOrderForm({
  jobs,
  initialJobId,
  profileId,
  raisedByName,
}: {
  jobs: JobOption[]
  initialJobId?: string
  profileId: string
  raisedByName: string
}) {
  const router = useRouter()
  const [jobLabel, setJobLabel] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const preselected = initialJobId ? jobs.find((job) => job.id === initialJobId) : undefined
    if (preselected) setJobLabel(preselected.name)
  }, [initialJobId, jobs])

  const matchedJob = useMemo(
    () => jobs.find((job) => job.name.toLowerCase() === jobLabel.trim().toLowerCase()),
    [jobs, jobLabel]
  )

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!jobLabel.trim()) return setError('Which job is this on?')
    if (!description.trim()) return setError('Say what changed.')
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return setError('No signal. Try again when you have a bar or two — nothing is lost.')
    }

    setBusy(true)
    const supabase = createClient()

    const { data: order, error: insertError } = await supabase
      .from('change_orders')
      .insert({
        job_id: matchedJob?.id ?? null,
        job_label: jobLabel.trim(),
        description: description.trim(),
        raised_by: profileId,
        raised_by_name: raisedByName,
      })
      .select('id')
      .single()

    if (insertError || !order) {
      setBusy(false)
      return setError(`That did not save: ${insertError?.message ?? 'unknown error'}`)
    }

    // Photos are a nice-to-have. If one fails the note is already saved, so
    // say so rather than throwing the whole thing away.
    for (const file of files) {
      const path = `change-orders/${profileId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}-${safeName(file.name)}`

      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type || undefined })

      if (uploadError) {
        setBusy(false)
        return setError(
          `Your note is saved, but ${file.name} would not upload. The office has the note.`
        )
      }

      await supabase.from('change_order_media').insert({
        change_order_id: order.id,
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        original_name: file.name,
      })
    }

    // Fire the office email. A mail failure must not lose the record, so the
    // route always answers ok and we carry on either way.
    try {
      await fetch('/admin/api/change-order-notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: order.id }),
      })
    } catch {
      // Saved regardless.
    }

    router.push(`/admin/change-orders/${order.id}?new=1`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="adm-note adm-note-bad adm-mb">{error}</div> : null}

      <div className="adm-card">
        <label className="adm-field">
          <span className="adm-field-label">
            Job <span className="adm-req">*</span>
          </span>
          <input
            type="text"
            list="co-job-options"
            value={jobLabel}
            onChange={(event) => setJobLabel(event.target.value)}
            autoCapitalize="words"
            autoComplete="off"
            required
          />
          <datalist id="co-job-options">
            {jobs.map((job) => (
              <option key={job.id} value={job.name} />
            ))}
          </datalist>
        </label>

        <label className="adm-field">
          <span className="adm-field-label">
            What changed? <span className="adm-req">*</span>
            <span className="adm-field-hint">
              Plain words are fine. What you were told, who told you, and what it
              means for the pour.
            </span>
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Super moved the truck court 12 ft east. Adds about 40 yards."
            required
          />
        </label>

        <label className="adm-field">
          <span className="adm-field-label">
            Photos (optional)
            <span className="adm-field-hint">A picture usually saves a phone call.</span>
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </label>

        <p className="adm-small adm-muted">
          Sent by {raisedByName}. The time is recorded automatically.
        </p>
      </div>

      <button
        type="submit"
        className="adm-btn adm-btn-primary adm-btn-block adm-mt"
        disabled={busy}
      >
        {busy ? 'Sending…' : 'Send it to the office'}
      </button>
    </form>
  )
}
