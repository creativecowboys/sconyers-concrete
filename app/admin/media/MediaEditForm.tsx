'use client'

import { useActionState, useState } from 'react'
import {
  MEDIA_DESTINATIONS,
  MEDIA_DESTINATION_LABELS,
  type MediaItem,
} from '@/lib/admin/types'
import JobPicker, { matchJob, type JobOption } from '../_components/JobPicker'
import { updateMedia, type UpdateMediaState } from './actions'

/**
 * "Edit" on a photo card. Closed, it is one small button so the library stays
 * scannable; open, it is the four labels anyone can fix — job, date taken,
 * caption, destination — with the same job picker the upload form uses.
 *
 * It closes itself after a successful save. The page revalidates behind it,
 * so the card above shows the new values and the form mounts fresh from them
 * the next time it opens.
 */
export default function MediaEditForm({
  item,
  jobs,
}: {
  item: Pick<MediaItem, 'id' | 'job_label' | 'captured_on' | 'caption' | 'destination'>
  jobs: JobOption[]
}) {
  const [state, formAction, pending] = useActionState<UpdateMediaState, FormData>(
    updateMedia,
    null
  )

  // `attempt` goes up every time the form is opened and is echoed back by the
  // action, so "closed because this save succeeded" is derived from the
  // action result rather than set from an effect. Reopening bumps it, which
  // also remounts the fields fresh from the (now revalidated) item.
  const [wanted, setWanted] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const open = wanted && !(state?.ok && state.attempt === attempt)

  if (!open) {
    return (
      <button
        type="button"
        className="adm-btn adm-btn-sm adm-mt"
        onClick={() => {
          setAttempt((n) => n + 1)
          setWanted(true)
        }}
      >
        Edit details
      </button>
    )
  }

  return (
    <EditFields
      key={attempt}
      item={item}
      jobs={jobs}
      attempt={attempt}
      formAction={formAction}
      pending={pending}
      error={state && !state.ok ? state.error : null}
      onCancel={() => setWanted(false)}
    />
  )
}

function EditFields({
  item,
  jobs,
  attempt,
  formAction,
  pending,
  error,
  onCancel,
}: {
  item: Pick<MediaItem, 'id' | 'job_label' | 'captured_on' | 'caption' | 'destination'>
  jobs: JobOption[]
  attempt: number
  formAction: (formData: FormData) => void
  pending: boolean
  error: string | null
  onCancel: () => void
}) {
  // A job that has since closed, or was typed in by the crew, is not in the
  // dropdown — start in the text box so the label is not silently blanked.
  const [jobLabel, setJobLabel] = useState(item.job_label)
  const [typingJob, setTypingJob] = useState(
    Boolean(item.job_label.trim()) && !matchJob(jobs, item.job_label)
  )

  return (
    <form action={formAction} className="adm-mt">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="attempt" value={attempt} />

      {error ? <div className="adm-note adm-note-bad adm-mb">{error}</div> : null}

      <JobPicker
        jobs={jobs}
        value={jobLabel}
        typing={typingJob}
        onChange={({ label, typing }) => {
          setJobLabel(label)
          setTypingJob(typing)
        }}
        pickHint="Move it to a different job, or fix a wrong one."
      />

      <label className="adm-field adm-mt">
        <span className="adm-field-label">
          Date taken <span className="adm-req">*</span>
        </span>
        <input
          type="date"
          name="captured_on"
          defaultValue={item.captured_on.slice(0, 10)}
          required
        />
      </label>

      <label className="adm-field">
        <span className="adm-field-label">
          Caption
          <span className="adm-field-hint">
            What it shows. Goes out with the photo if it is posted to Google.
          </span>
        </span>
        <textarea name="caption" rows={3} defaultValue={item.caption ?? ''} />
      </label>

      <label className="adm-field">
        <span className="adm-field-label">
          Where should this go?
          <span className="adm-field-hint">
            Google or Both puts it in the listing queue; anything else takes it
            back out. Already posted stays posted.
          </span>
        </span>
        <select name="destination" defaultValue={item.destination}>
          {MEDIA_DESTINATIONS.map((value) => (
            <option key={value} value={value}>
              {MEDIA_DESTINATION_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="adm-btn-row">
        <button
          type="submit"
          className="adm-btn adm-btn-sm adm-btn-primary"
          disabled={pending}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-sm"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
