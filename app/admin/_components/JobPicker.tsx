'use client'

import { useMemo } from 'react'

/** Sentinel for the "not listed" row in the job dropdown. */
export const NOT_LISTED = '__not_listed__'

export type JobOption = { id: string; name: string }

/** The job in `jobs` whose name matches `label`, ignoring case. */
export function matchJob(jobs: JobOption[], label: string) {
  const wanted = label.trim().toLowerCase()
  return jobs.find((job) => job.name.toLowerCase() === wanted)
}

/**
 * The one way a job gets picked in the admin: a dropdown of the open jobs,
 * with "Not listed — type it in" as the escape hatch for a job the office has
 * not entered yet. Used by the upload form and the photo-library edit form,
 * so the two never drift apart.
 *
 * Controlled. The parent owns `value` (the job label) and `typing` (whether
 * the text box is showing instead of the dropdown); `onChange` reports both.
 * The field submits as `name` — the label, never the sentinel.
 */
export default function JobPicker({
  jobs,
  value,
  typing,
  onChange,
  name = 'job',
  required = true,
  pickHint = 'Pick the job these are from.',
}: {
  jobs: JobOption[]
  value: string
  typing: boolean
  onChange: (next: { label: string; typing: boolean }) => void
  name?: string
  required?: boolean
  pickHint?: string
}) {
  const matched = useMemo(() => matchJob(jobs, value), [jobs, value])

  return (
    <>
      <label className="adm-field">
        <span className="adm-field-label">
          Job {required ? <span className="adm-req">*</span> : null}
          <span className="adm-field-hint">
            {typing
              ? 'Type the job name. The office will tie it to a job later.'
              : pickHint}
          </span>
        </span>
        {typing ? (
          <input
            type="text"
            name={name}
            value={value}
            onChange={(event) => onChange({ label: event.target.value, typing: true })}
            autoCapitalize="words"
            autoComplete="off"
            required={required}
          />
        ) : (
          <select
            name={name}
            value={value}
            onChange={(event) => {
              if (event.target.value === NOT_LISTED) {
                onChange({ label: '', typing: true })
                return
              }
              onChange({ label: event.target.value, typing: false })
            }}
            required={required}
          >
            <option value="" disabled>
              Choose a job…
            </option>
            {jobs.map((job) => (
              <option key={job.id} value={job.name}>
                {job.name}
              </option>
            ))}
            <option value={NOT_LISTED}>Not listed — type it in</option>
          </select>
        )}
      </label>

      {typing ? (
        <button
          type="button"
          className="adm-btn adm-btn-sm"
          onClick={() => onChange({ label: '', typing: false })}
        >
          Back to the job list
        </button>
      ) : null}

      {typing && value.trim() && !matched ? (
        <div className="adm-note adm-small adm-mt">
          New job name. That is fine — the office will tie it to a job later.
        </div>
      ) : null}
    </>
  )
}
