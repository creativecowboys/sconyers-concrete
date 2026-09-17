'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DOC_ACCEPT,
  DOC_MAX_BYTES,
  DOC_MAX_LABEL,
  DOC_TYPES_HINT,
  isAllowedDoc,
  safeDocName,
  titleFromFilename,
} from '@/lib/admin/docs'
import { formatBytes } from '@/lib/admin/format'
import { DOCS_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { recordDocument } from './actions'

type Outcome = { name: string; ok: boolean; message?: string }

type Status =
  | { kind: 'idle' }
  | { kind: 'uploading'; current: number; total: number; name: string }
  | { kind: 'finished'; outcomes: Outcome[] }
  | { kind: 'error'; message: string }

/**
 * One or several files, straight from the browser to the private `docs` bucket
 * (the way the photo uploader does it), then a server action writes each row.
 * Files go up one after another so a weak signal only has to carry one at a
 * time, and one bad file does not stop the rest. With a single file the title
 * is editable; with several, each file is titled from its filename (rename
 * later is not built yet — name the files the way the crew would look for them).
 */
export default function DocUploadForm({ profileId }: { profileId: string }) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState('')
  // Once someone has typed a title, picking a different file must not wipe it.
  const [titleTouched, setTitleTouched] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onFilesPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    setFiles(picked)
    setStatus({ kind: 'idle' })
    if (picked.length === 1 && !titleTouched) setTitle(titleFromFilename(picked[0].name))
  }

  async function uploadOne(file: File, fileTitle: string): Promise<Outcome> {
    if (!isAllowedDoc(file.name)) {
      return { name: file.name, ok: false, message: `that type is not allowed (${DOC_TYPES_HINT})` }
    }
    if (file.size > DOC_MAX_BYTES) {
      return {
        name: file.name,
        ok: false,
        message: `it is ${formatBytes(file.size)}, over the ${DOC_MAX_LABEL} limit`,
      }
    }

    const supabase = createClient()
    const path = `${profileId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeDocName(file.name)}`

    const { error: uploadError } = await supabase.storage
      .from(DOCS_BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false })

    if (uploadError) return { name: file.name, ok: false, message: `did not go up: ${uploadError.message}` }

    const result = await recordDocument({
      title: fileTitle,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      original_name: file.name,
    })

    if (!result.ok) {
      return { name: file.name, ok: false, message: `uploaded but was not filed: ${result.message}. Tell the office` }
    }
    return { name: file.name, ok: true }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (files.length === 0) {
      setStatus({ kind: 'error', message: 'Choose a file first.' })
      return
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus({
        kind: 'error',
        message: 'No signal right now. Try again when you have a bar or two.',
      })
      return
    }

    const outcomes: Outcome[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setStatus({ kind: 'uploading', current: i + 1, total: files.length, name: file.name })
      const fileTitle =
        files.length === 1 ? title.trim() || titleFromFilename(file.name) : titleFromFilename(file.name)
      outcomes.push(await uploadOne(file, fileTitle))
    }

    const failed = outcomes.filter((o) => !o.ok)
    setFiles([])
    setTitle('')
    setTitleTouched(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setStatus({ kind: 'finished', outcomes })
    if (failed.length < outcomes.length) router.refresh()
  }

  const uploading = status.kind === 'uploading'
  const oversize = files.filter((f) => f.size > DOC_MAX_BYTES)

  return (
    <form onSubmit={onSubmit}>
      {status.kind === 'finished' ? (
        <>
          {status.outcomes.some((o) => o.ok) ? (
            <div className="adm-note adm-note-ok adm-mb">
              <strong>
                {status.outcomes.filter((o) => o.ok).length === 1
                  ? `${status.outcomes.find((o) => o.ok)!.name} is in the folder.`
                  : `${status.outcomes.filter((o) => o.ok).length} files are in the folder.`}
              </strong>{' '}
              Everyone signed in can open them now.
            </div>
          ) : null}
          {status.outcomes
            .filter((o) => !o.ok)
            .map((o) => (
              <div key={o.name} className="adm-note adm-note-bad adm-mb">
                {o.name}: {o.message}.
              </div>
            ))}
        </>
      ) : null}

      {status.kind === 'error' ? (
        <div className="adm-note adm-note-bad adm-mb">{status.message}</div>
      ) : null}

      <div className="adm-card">
        <label className="adm-field">
          <span className="adm-field-label">
            Files <span className="adm-req">*</span>
            <span className="adm-field-hint">{DOC_TYPES_HINT}</span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={DOC_ACCEPT}
            multiple
            onChange={onFilesPicked}
            required
          />
        </label>

        {files.length > 0 ? (
          <ul className="adm-small adm-muted adm-mb">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`}>
                {f.name} · {formatBytes(f.size)}
                {f.size > DOC_MAX_BYTES ? ` — over ${DOC_MAX_LABEL}, will be skipped` : ''}
              </li>
            ))}
          </ul>
        ) : null}

        {oversize.length > 0 ? (
          <p className="adm-small adm-mb">
            Drawing set too big? Export it at a lower resolution, or split it into a few PDFs.
          </p>
        ) : null}

        {files.length <= 1 ? (
          <label className="adm-field">
            <span className="adm-field-label">
              Title
              <span className="adm-field-hint">
                Starts as the filename. Change it to whatever the crew would look for.
              </span>
            </span>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setTitleTouched(true)
              }}
              autoCapitalize="sentences"
              autoComplete="off"
              maxLength={200}
            />
          </label>
        ) : (
          <p className="adm-small adm-muted adm-mb">
            Uploading {files.length} files. Each one is titled from its filename.
          </p>
        )}

        <button
          type="submit"
          className="adm-btn adm-btn-primary adm-btn-block"
          disabled={uploading}
        >
          {status.kind === 'uploading'
            ? status.total > 1
              ? `Uploading ${status.current} of ${status.total}…`
              : 'Uploading…'
            : files.length > 1
              ? `Upload ${files.length} files`
              : 'Upload'}
        </button>
      </div>
    </form>
  )
}
