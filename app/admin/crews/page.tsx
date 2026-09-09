import { requireOffice } from '@/lib/admin/auth'
import { formatDate } from '@/lib/admin/format'
import { getOrigin } from '@/lib/admin/origin'
import type { Crew } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'
import CopyField from '../_components/CopyField'
import SubmitButton from '../_components/SubmitButton'
import { createCrew, createCrewEvent, deleteCrewEvent, rotateFeedToken } from './actions'

type Search = Record<string, string | string[] | undefined>

type EventRow = {
  id: string
  crew_id: string
  title: string
  location: string | null
  notes: string | null
  starts_on: string
  ends_on: string | null
  start_time: string | null
  end_time: string | null
}

const ERRORS: Record<string, string> = {
  'crew-name': 'Give the crew a name.',
  event: 'A schedule entry needs a crew, a title and a start date.',
  save: 'That did not save. Try again.',
}

/** "08:00:00" → "8:00 AM". */
function clockLabel(time: string | null) {
  if (!time) return null
  const [hourText, minute] = time.split(':')
  const hour = Number(hourText)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const twelve = hour % 12 === 0 ? 12 : hour % 12
  return `${twelve}:${minute} ${suffix}`
}

export default async function CrewsPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  await requireOffice()
  const params = await searchParams
  const error = Array.isArray(params.error) ? params.error[0] : params.error
  const rotated = (Array.isArray(params.rotated) ? params.rotated[0] : params.rotated) === '1'

  const origin = await getOrigin()
  const supabase = await createClient()

  const [{ data: crews }, { data: events }, { data: jobs }] = await Promise.all([
    supabase.from('crews').select('id, name, feed_token, active').order('name'),
    supabase
      .from('crew_events')
      .select('id, crew_id, title, location, notes, starts_on, ends_on, start_time, end_time')
      .gte('starts_on', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
      .order('starts_on')
      .limit(300),
    supabase
      .from('jobs')
      .select('id, name')
      .in('status', ['bidding', 'upcoming', 'active', 'on_hold'])
      .order('name')
      .limit(300),
  ])

  const crewList = (crews ?? []) as Crew[]
  const eventList = (events ?? []) as EventRow[]

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Crews &amp; schedule</h1>
          <p>
            Each crew gets a calendar link. Subscribe to it once in Google,
            Apple or Outlook and it stays current — no app to install, nothing
            to log into.
          </p>
        </div>
      </div>

      {error ? (
        <div className="adm-note adm-note-bad adm-mb">{ERRORS[error] ?? ERRORS.save}</div>
      ) : null}
      {rotated ? (
        <div className="adm-note adm-note-warn adm-mb">
          <strong>New link issued.</strong> The old one has stopped working —
          anyone on that crew needs to subscribe again.
        </div>
      ) : null}

      <h2 className="adm-mb">Put a crew on a job</h2>
      <form action={createCrewEvent} className="adm-card">
        <label className="adm-field">
          <span className="adm-field-label">
            Crew <span className="adm-req">*</span>
          </span>
          <select name="crew_id" required defaultValue="">
            <option value="" disabled>
              Pick a crew
            </option>
            {crewList.map((crew) => (
              <option key={crew.id} value={crew.id}>
                {crew.name}
              </option>
            ))}
          </select>
        </label>

        <label className="adm-field">
          <span className="adm-field-label">
            What shows on the calendar <span className="adm-req">*</span>
            <span className="adm-field-hint">
              This is the line a crew member reads on their phone. Job name and
              scope beats a code.
            </span>
          </span>
          <input type="text" name="title" required placeholder="Tanner outparcel — pour truck court" />
        </label>

        <label className="adm-field">
          <span className="adm-field-label">Job (optional)</span>
          <select name="job_id" defaultValue="">
            <option value="">Not tied to a job</option>
            {(jobs ?? []).map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </select>
        </label>

        <div className="adm-grid adm-grid-2">
          <label className="adm-field">
            <span className="adm-field-label">
              Start date <span className="adm-req">*</span>
            </span>
            <input type="date" name="starts_on" required />
          </label>
          <label className="adm-field">
            <span className="adm-field-label">End date (optional)</span>
            <input type="date" name="ends_on" />
          </label>
        </div>

        <div className="adm-grid adm-grid-2">
          <label className="adm-field" style={{ marginBottom: 0 }}>
            <span className="adm-field-label">Start time</span>
            <input type="time" name="start_time" />
          </label>
          <label className="adm-field" style={{ marginBottom: 0 }}>
            <span className="adm-field-label">End time</span>
            <input type="time" name="end_time" />
          </label>
        </div>
        {/* One hint for the pair. Hanging it off Start time alone pushed that
            input down a line and left End time sitting higher — Dave, Sep 9. */}
        <p className="adm-field-hint adm-mb">Leave both blank for an all-day entry.</p>

        <label className="adm-field">
          <span className="adm-field-label">Where</span>
          <input type="text" name="location" placeholder="2290 Strawn Rd, Winston GA" />
        </label>

        <label className="adm-field">
          <span className="adm-field-label">Notes</span>
          <textarea name="notes" />
        </label>

        <SubmitButton className="adm-btn adm-btn-primary adm-btn-block" pendingLabel="Saving…">
          Add to the schedule
        </SubmitButton>
      </form>

      <h2 className="adm-mt-lg adm-mb">Crews</h2>
      {crewList.length === 0 ? (
        <div className="adm-empty adm-mb">No crews yet. Add the first one below.</div>
      ) : (
        <div className="adm-stack">
          {crewList.map((crew) => {
            const feedUrl = `${origin}/api/crew-calendar/${crew.feed_token}.ics`
            const crewEvents = eventList.filter((event) => event.crew_id === crew.id)

            return (
              <div key={crew.id} className="adm-card">
                <h2 className="adm-mb">{crew.name}</h2>

                <CopyField value={feedUrl} label="Calendar subscription link" />

                <details className="adm-mt">
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                    How to subscribe
                  </summary>
                  <div className="adm-small adm-muted adm-mt">
                    <p>
                      <strong>Google Calendar (on a computer):</strong> Other
                      calendars → + → From URL → paste → Add calendar. It shows
                      up on the phone afterwards.
                    </p>
                    <p className="adm-mt">
                      <strong>iPhone:</strong> Settings → Apps → Calendar →
                      Calendar Accounts → Add Account → Other → Add Subscribed
                      Calendar → paste.
                    </p>
                    <p className="adm-mt">
                      <strong>Outlook:</strong> Add calendar → Subscribe from
                      web → paste.
                    </p>
                    <p className="adm-mt">
                      Calendar apps refresh on their own schedule — Google can
                      take several hours to pick up a change. Anything urgent
                      still needs a phone call.
                    </p>
                  </div>
                </details>

                <h3 className="adm-mt-lg adm-mb">On the board</h3>
                {crewEvents.length === 0 ? (
                  <p className="adm-small adm-muted">Nothing scheduled.</p>
                ) : (
                  <div className="adm-stack">
                    {crewEvents.map((event) => (
                      <div key={event.id} className="adm-row">
                        <div className="adm-row-title">
                          <span>{event.title}</span>
                        </div>
                        <div className="adm-row-meta">
                          {formatDate(event.starts_on)}
                          {event.ends_on && event.ends_on !== event.starts_on
                            ? ` → ${formatDate(event.ends_on)}`
                            : ''}
                          {event.start_time ? ` · ${clockLabel(event.start_time)}` : ' · all day'}
                          {event.end_time ? `–${clockLabel(event.end_time)}` : ''}
                        </div>
                        {event.location ? (
                          <div className="adm-row-meta">{event.location}</div>
                        ) : null}
                        <form action={deleteCrewEvent} className="adm-mt">
                          <input type="hidden" name="id" value={event.id} />
                          <SubmitButton className="adm-btn adm-btn-sm" pendingLabel="Removing…">
                            Remove
                          </SubmitButton>
                        </form>
                      </div>
                    ))}
                  </div>
                )}

                <form action={rotateFeedToken} className="adm-mt">
                  <input type="hidden" name="id" value={crew.id} />
                  <SubmitButton className="adm-btn adm-btn-sm" pendingLabel="Issuing…">
                    Issue a new link
                  </SubmitButton>
                </form>
              </div>
            )
          })}
        </div>
      )}

      <h2 className="adm-mt-lg adm-mb">Add a crew</h2>
      <form action={createCrew} className="adm-card">
        <label className="adm-field">
          <span className="adm-field-label">
            Crew name <span className="adm-req">*</span>
          </span>
          <input type="text" name="name" required placeholder="Flatwork crew" />
        </label>
        <SubmitButton className="adm-btn adm-btn-block" pendingLabel="Adding…">
          Add crew
        </SubmitButton>
      </form>
    </>
  )
}
