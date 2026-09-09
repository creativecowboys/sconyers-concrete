import Link from 'next/link'
import { formatDate } from '@/lib/admin/format'
import type { HealthStatus, JobHealth } from '@/lib/admin/job-health'

const TONE: Record<HealthStatus, 'ok' | 'warn' | 'bad'> = {
  on_track: 'ok',
  watch: 'warn',
  behind: 'bad',
}

const LABEL: Record<HealthStatus, string> = {
  on_track: 'On track',
  watch: 'Watch',
  behind: 'Behind',
}

/**
 * One row per active job: name, status pill, and a bar of crew days on site
 * against working days planned. Server component — everything is computed in
 * lib/admin/job-health.ts before it gets here.
 */
export default function JobHealthPanel({ jobs }: { jobs: JobHealth[] }) {
  return (
    <section className="adm-health adm-mt" aria-labelledby="adm-health-title">
      <div className="adm-health-head">
        <h2 id="adm-health-title">Active jobs</h2>
        <span className="adm-small adm-muted">Crew days on site vs. days planned</span>
      </div>

      {jobs.length === 0 ? (
        <div className="adm-empty">No active jobs</div>
      ) : (
        <div className="adm-stack">
          {jobs.map((job) => {
            const plan = job.plan
            const tone = plan ? TONE[plan.status] : null
            const fill = plan
              ? Math.min(100, Math.round((plan.daysOnSite / plan.daysPlanned) * 100))
              : 0

            return (
              <Link
                key={job.id}
                href={`/admin/jobs/${job.id}`}
                className="adm-row adm-health-row"
              >
                <div className="adm-row-title">
                  <span>{job.name}</span>
                  {plan && tone ? (
                    <span className={`adm-badge adm-badge-${tone}`}>
                      {LABEL[plan.status]}
                      {plan.reason ? ` · ${plan.reason}` : ''}
                    </span>
                  ) : null}
                </div>

                {/* Who is on it, and when they are expected to be done. */}
                <div className="adm-row-meta">
                  {job.crews && job.crews.length > 0
                    ? job.crews.join(', ')
                    : 'No crew scheduled'}
                  {job.due
                    ? ` · ${job.due.past ? 'Was due' : 'Due'} ${formatDate(job.due.date)}`
                    : ''}
                </div>

                {plan && tone ? (
                  <div className="adm-health-bar">
                    <div
                      className={`adm-progress adm-progress-${tone}`}
                      role="img"
                      aria-label={`${plan.daysOnSite} of ${plan.daysPlanned} planned days used`}
                    >
                      <span style={{ width: `${fill}%` }} />
                      {/* Where today falls in the plan. Fill past this mark = burning days faster than planned. */}
                      <i
                        className="adm-health-today"
                        style={{ left: `${Math.round(plan.elapsedShare * 100)}%` }}
                      />
                    </div>
                    <span className="adm-health-count">
                      {plan.daysOnSite} of {plan.daysPlanned} days
                    </span>
                  </div>
                ) : (
                  <div className="adm-row-meta">No schedule yet</div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
