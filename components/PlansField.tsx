'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  PLAN_ACCEPT,
  PLAN_HINT,
  PLAN_MAX_FILES,
  checkPlanFile,
  cleanFileName,
  formatBytes,
  localDateStamp,
  planPathname,
  type PlanAttachmentRef,
} from '@/lib/plans'

/**
 * "Attach plans (optional)" on the estimate forms. Each file uploads the
 * moment it is picked, straight from the browser to the private Blob store
 * (see lib/plans.ts), so by the time someone has typed their details the plans
 * are usually already up. Sending the form waits for any upload still running;
 * a file that fails is left out and the lead still goes.
 */

export type PlanItem = {
  id: string
  name: string
  size: number
  status: 'uploading' | 'done' | 'error'
  /** 0-100 */
  progress: number
  pathname?: string
}

export type PlanUploads = {
  items: PlanItem[]
  notices: string[]
  announcement: string
  busy: boolean
  /** Average progress of the uploads still running, 0-100. */
  progress: number
  addFiles: (files: File[]) => void
  remove: (id: string) => void
  /** Waits for every running upload, then reports what made it and what did not. */
  settle: () => Promise<{ attached: PlanAttachmentRef[]; failed: number }>
}

export function usePlanUploads(): PlanUploads {
  const [items, setItems] = useState<PlanItem[]>([])
  const [notices, setNotices] = useState<string[]>([])
  const [announcement, setAnnouncement] = useState('')
  // Mirrors of state for code that runs outside render (upload callbacks, settle).
  const itemsRef = useRef<PlanItem[]>([])
  const tasks = useRef(new Map<string, { controller: AbortController; done: Promise<void> }>())
  const nextId = useRef(0)

  const commit = useCallback((next: PlanItem[]) => {
    itemsRef.current = next
    setItems(next)
  }, [])

  const update = useCallback(
    (id: string, patch: Partial<PlanItem>) => {
      if (!itemsRef.current.some((item) => item.id === id)) return
      commit(itemsRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    },
    [commit]
  )

  // Leaving the page mid-upload: stop the uploads.
  useEffect(() => {
    const running = tasks.current
    return () => {
      for (const task of running.values()) task.controller.abort()
    }
  }, [])

  const addFiles = useCallback(
    (files: File[]) => {
      const problems: string[] = []
      const added: { item: PlanItem; file: File; ext: string; contentType: string }[] = []
      let room = PLAN_MAX_FILES - itemsRef.current.length
      let overLimit = false

      for (const file of files) {
        const check = checkPlanFile(file)
        if (!check.ok) {
          problems.push(check.message)
          continue
        }
        if (room <= 0) {
          overLimit = true
          continue
        }
        room--
        nextId.current += 1
        added.push({
          item: {
            id: `plan-${nextId.current}`,
            name: cleanFileName(file.name) || 'Plans',
            size: file.size,
            status: 'uploading',
            progress: 0,
          },
          file,
          ext: check.ext,
          contentType: check.contentType,
        })
      }
      if (overLimit) {
        problems.push(`Up to ${PLAN_MAX_FILES} files. Zip the rest into one file and attach that.`)
      }
      setNotices(problems)
      if (!added.length) return

      commit([...itemsRef.current, ...added.map((entry) => entry.item)])
      const total = itemsRef.current.length

      for (const { item, file, ext, contentType } of added) {
        const controller = new AbortController()
        const done = (async () => {
          try {
            // Loaded on first use, so pages that never attach anything never download it.
            const { upload } = await import('@vercel/blob/client')
            const blob = await upload(planPathname(file.name, ext, localDateStamp(new Date())), file, {
              access: 'private',
              handleUploadUrl: '/api/plans/upload',
              contentType,
              clientPayload: JSON.stringify({ files: total }),
              abortSignal: controller.signal,
              onUploadProgress: ({ percentage }) =>
                update(item.id, { progress: Math.min(99, Math.round(percentage)) }),
            })
            update(item.id, { status: 'done', progress: 100, pathname: blob.pathname })
            setAnnouncement(`${item.name} attached.`)
          } catch (err) {
            if (controller.signal.aborted) return
            console.warn('[plans] upload failed', err)
            update(item.id, { status: 'error' })
            setAnnouncement(`${item.name} did not upload.`)
          } finally {
            tasks.current.delete(item.id)
          }
        })()
        tasks.current.set(item.id, { controller, done })
      }
    },
    [commit, update]
  )

  const remove = useCallback(
    (id: string) => {
      tasks.current.get(id)?.controller.abort()
      tasks.current.delete(id)
      const removed = itemsRef.current.find((item) => item.id === id)
      commit(itemsRef.current.filter((item) => item.id !== id))
      setNotices([])
      if (removed) setAnnouncement(`${removed.name} removed.`)
    },
    [commit]
  )

  const settle = useCallback(async () => {
    await Promise.allSettled([...tasks.current.values()].map((task) => task.done))
    const current = itemsRef.current
    return {
      attached: current
        .filter((item) => item.status === 'done' && item.pathname)
        .map((item) => ({ pathname: item.pathname!, name: item.name })),
      failed: current.filter((item) => item.status === 'error').length,
    }
  }, [])

  const running = items.filter((item) => item.status === 'uploading')
  return {
    items,
    notices,
    announcement,
    busy: running.length > 0,
    progress: running.length
      ? Math.round(running.reduce((sum, item) => sum + item.progress, 0) / running.length)
      : 100,
    addFiles,
    remove,
    settle,
  }
}

export default function PlansField({
  uploads,
  disabled = false,
}: {
  uploads: PlanUploads
  disabled?: boolean
}) {
  const inputId = useId()
  const hintId = useId()
  const { items, notices, announcement } = uploads
  const full = items.length >= PLAN_MAX_FILES

  return (
    <div className="form-group plans-field">
      <div className="plans-row">
        <input
          id={inputId}
          className="plans-input"
          type="file"
          multiple
          accept={PLAN_ACCEPT}
          aria-describedby={hintId}
          disabled={disabled || full}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? [])
            // Clear it so picking the same file again (after removing it) still fires.
            event.currentTarget.value = ''
            if (files.length) uploads.addFiles(files)
          }}
        />
        <label htmlFor={inputId} className="plans-pick" aria-disabled={disabled || full}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path
              d="M21 11.5 12.4 20a5.5 5.5 0 0 1-7.8-7.8l8.9-8.9a3.7 3.7 0 0 1 5.2 5.2l-8.9 8.9a1.8 1.8 0 0 1-2.6-2.6l8.1-8.1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Attach plans <span className="plans-optional">(optional)</span>
        </label>
        <span id={hintId} className="plans-hint">
          {full ? `${PLAN_MAX_FILES} of ${PLAN_MAX_FILES} files attached` : PLAN_HINT}
        </span>
      </div>

      {items.length > 0 && (
        <ul className="plans-list">
          {items.map((item) => (
            <li key={item.id} className={`plans-item is-${item.status}`}>
              <span className="plans-name">{item.name}</span>
              <span className="plans-meta">
                {item.status === 'uploading'
                  ? `Uploading ${item.progress}%`
                  : item.status === 'done'
                    ? `Attached · ${formatBytes(item.size)}`
                    : 'Upload failed'}
              </span>
              <button
                type="button"
                className="plans-remove"
                onClick={() => uploads.remove(item.id)}
                disabled={disabled}
                aria-label={`Remove ${item.name}`}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
                </svg>
              </button>
              {item.status === 'uploading' && (
                <span className="plans-bar" aria-hidden="true">
                  <span style={{ width: `${item.progress}%` }} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {notices.length > 0 && (
        <div className="plans-notice" role="alert">
          {notices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
        </div>
      )}

      <p className="plans-live" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
