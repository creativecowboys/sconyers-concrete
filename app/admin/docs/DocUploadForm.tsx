'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DOC_ACCEPT,
  DOC_MAX_BYTES,
  DOC_TYPES_HINT,
  isAllowedDoc,
  safeDocName,
  titleFromFilename,
} from '@/lib/admin/docs'
import { formatBytes } from '@/lib/admin/format'
import { DOCS_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { recordDocument } from './actions'

type Status =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'done'; title: string }
  | { kind: 'error'; message: string }

/**
 * One file at a time, straight from the browser to the private `docs` bucket
 * (the way the photo uploader does it), then a server action writes the row.
 */
export default function DocUploadForm({ profileId }: { profileId: string }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  // Once someone has typed a title, picking a different file must not wipe it.
  const [titleTouched, setTitleTouched] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null
    setFile(picked)
    setStatus({ kind: 'idle' })
    if (picked && !titleTouched) setTitle(titleFromFilename(picked.name))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setStatus({ kind: 'error', message: 'Choose a file first.' })
      return
    }
    if (!isAllowedDoc(file.name)) {
      setStatus({ kind: 'error', message: `That type is not allowed. ${DOC_TYPES_HINT}` })
      return
    }
    if (file.size > DOC_MAX_BYTES) {
      setStatus({
        kind: 'error',
        message: `${file.name} is ${formatBytes(file.size)} — the limit is 25 MB.`,
      })
      return
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus({
        kind: 'error',
        message: 'No signal right now. Try again when you have a bar or two.',
      })
      return
    }

    const cleanTitle = title.trim() || titleFromFilename(file.name)
    setStatus({ kind: 'uploading' })

    const supabase = createClient()
    const path = `${profileId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeDocName(file.name)}`

    const { error: uploadError } = await supabase.storage
      .from(DOCS_BUCKET)
      .upload(path, file, { contentType: file.type || undefined, upsert: false })

    if (uploadError) {
      setStatus({ kind: 'error', message: `${file.name} did not go up: ${uploadError.message}` })
      return
    }

    const result = await recordDocument({
      title: cleanTitle,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      original_name: file.name,
    })

    if (!result.ok) {
      setStatus({
        kind: 'error',
        message: `${file.name} uploaded but was not filed: ${result.message}. Tell the office.`,
      })
      return
    }

    setFile(null)
    setTitle('')
    setTitleTouched(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setStatus({ kind: 'done', title: cleanTitle })
    router.refresh()
  }

  const uploading = status.kind === 'uploading'

  return (
    <form onSubmit={onSubmit}>
      {status.kind === 'done' ? (
        <div className="adm-note adm-note-ok adm-mb">
          <strong>{status.title} is in the folder.</strong> Everyone signed in can
          open it now.
        </div>
      ) : null}

      {status.kind === 'error' ? (
        <div className="adm-note adm-note-bad adm-mb">{status.message}</div>
      ) : null}

      <div className="adm-card">
        <label className="adm-field">
          <span className="adm-field-label">
            File <span className="adm-req">*</span>
            <span className="adm-field-hint">{DOC_TYPES_HINT}</span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={DOC_ACCEPT}
            onChange={onFilePicked}
            required
          />
        </label>

        {file ? (
          <p className="adm-small adm-muted adm-mb">
            {file.name} · {formatBytes(file.size)}
          </p>
        ) : null}

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

        <button
          type="submit"
          className="adm-btn adm-btn-primary adm-btn-block"
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  )
}
