import { JOB_STATUS_LABELS, JOB_STATUSES, type Job } from '@/lib/admin/types'
import SubmitButton from './SubmitButton'

const ERRORS: Record<string, string> = {
  name: 'A job name is required.',
  save: 'That did not save. Try again, and tell Creative Cowboys if it keeps happening.',
}

export default function JobForm({
  action,
  job,
  error,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>
  job?: Job
  error?: string
  submitLabel: string
}) {
  return (
    <form action={action} className="adm-card">
      {error ? (
        <div className="adm-note adm-note-bad adm-mb">{ERRORS[error] ?? ERRORS.save}</div>
      ) : null}

      {job ? <input type="hidden" name="id" value={job.id} /> : null}

      <label className="adm-field">
        <span className="adm-field-label">
          Job name <span className="adm-req">*</span>
          <span className="adm-field-hint">
            What the crew calls it. This is the name the field picks from when
            they upload photos, so keep it recognisable.
          </span>
        </span>
        <input type="text" name="name" defaultValue={job?.name ?? ''} required />
      </label>

      <label className="adm-field">
        <span className="adm-field-label">
          General contractor / client
          <span className="adm-field-hint">Who Sconyers is pouring for.</span>
        </span>
        <input type="text" name="client_name" defaultValue={job?.client_name ?? ''} />
      </label>

      <label className="adm-field">
        <span className="adm-field-label">Site address</span>
        <input type="text" name="address" defaultValue={job?.address ?? ''} />
      </label>

      <div className="adm-grid adm-grid-2">
        <label className="adm-field">
          <span className="adm-field-label">City</span>
          <input type="text" name="city" defaultValue={job?.city ?? ''} />
        </label>
        <label className="adm-field">
          <span className="adm-field-label">County</span>
          <input type="text" name="county" defaultValue={job?.county ?? ''} />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field-label">Status</span>
        <select name="status" defaultValue={job?.status ?? 'active'}>
          {JOB_STATUSES.map((value) => (
            <option key={value} value={value}>
              {JOB_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <div className="adm-grid adm-grid-2">
        <label className="adm-field">
          <span className="adm-field-label">Start date</span>
          <input type="date" name="start_date" defaultValue={job?.start_date ?? ''} />
        </label>
        <label className="adm-field">
          <span className="adm-field-label">Finish date</span>
          <input type="date" name="end_date" defaultValue={job?.end_date ?? ''} />
        </label>
      </div>

      <label className="adm-field">
        <span className="adm-field-label">
          Notes
          <span className="adm-field-hint">
            Anything the crew should see when they pull this job up on a phone.
          </span>
        </span>
        <textarea name="notes" defaultValue={job?.notes ?? ''} />
      </label>

      <SubmitButton className="adm-btn adm-btn-primary adm-btn-block" pendingLabel="Saving…">
        {submitLabel}
      </SubmitButton>
    </form>
  )
}
