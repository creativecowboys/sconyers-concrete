import Link from 'next/link'
import { formatDate } from '@/lib/admin/format'
import { healthStatus, type HealthStatus, type JobHealth } from '@/lib/admin/job-health'
import { formatCents } from '@/lib/admin/money'
import { formatPct } from '@/lib/admin/sov'

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
 * One row per active job: name, status pill, and a bar.
 *   Day rate — crew days on site against working days planned, plus what
 *              those days have earned against the bid.
 *   80/20    — SOV % complete, plus billed-to-date against the contract and
 *              the crew / Sconyers split.
 * Server component — everything is computed in lib/admin/job-health.ts before
 * it gets here.
 */
export default function JobHealthPanel({ jobs }: { jobs: JobHealth[] }) {
  return (
    <section className="adm-health adm-mt" aria-labelledby="adm-health-title">
      <div className="adm-health-head">
        <h2 id="adm-health-title">Active jobs</h2>
        <span className="adm-small adm-muted">Day rate: days on site vs. plan · 80/20: SOV % complete</span>
      </div>

      {jobs.length === 0 ? (
        <div className="adm-empty">No active jobs</div>
      ) : (
        <div className="adm-stack">
          {jobs.map((job) => {
            const status = healthStatus(job)
            const tone = status ? TONE[status] : null
            const reason = job.plan?.reason ?? job.sov?.reason ?? null

            return (
              <Link
                key={job.id}
                href={`/admin/jobs/${job.id}`}
                className="adm-row adm-health-row"
              >
                <div className="adm-row-title">
                  <span>{job.name}</span>
                  <span className="adm-health-pills">
                    <span className="adm-badge">{job.kind === 'eighty_twenty' ? '80/20' : 'Day rate'}</span>
                    {status && tone ? (
                      <span className={`adm-badge adm-badge-${tone}`}>
                        {LABEL[status]}
                        {reason ? ` · ${reason}` : ''}
                      </span>
                    ) : null}
                  </span>
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

                {job.kind === 'eighty_twenty' ? (
                  <SovLine job={job} />
                ) : (
                  <DayRateLine job={job} />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Bar({
  fill,
  tick,
  tone,
  label,
}: {
  fill: number
  tick: number | null
  tone: 'ok' | 'warn' | 'bad' | null
  label: string
}) {
  return (
    <div className={`adm-progress${tone ? ` adm-progress-${tone}` : ''}`} role="img" aria-label={label}>
      <span style={{ width: `${Math.min(100, Math.max(0, Math.round(fill * 100)))}%` }} />
      {/* Where today falls in the plan. Fill short of this mark = behind the calendar. */}
      {tick !== null ? (
        <i className="adm-health-today" style={{ left: `${Math.round(tick * 100)}%` }} />
      ) : null}
    </div>
  )
}

/** Days on site vs. days planned, and the money those days add up to. */
function DayRateLine({ job }: { job: JobHealth }) {
  const plan = job.plan
  const money = job.money
  const tone = plan ? TONE[plan.status] : null

  const moneyLine = money
    ? `${formatCents(money.earnedCents)} earned${money.bidCents !== null ? ` of ${formatCents(money.bidCents)} bid` : ''}`
    : null

  if (!plan) {
    return (
      <div className="adm-row-meta">
        No schedule yet{moneyLine ? ` · ${moneyLine}` : ''}
      </div>
    )
  }

  return (
    <>
      <div className="adm-health-bar">
        <Bar
          fill={plan.daysOnSite / plan.daysPlanned}
          tick={plan.elapsedShare}
          tone={tone}
          label={`${plan.daysOnSite} of ${plan.daysPlanned} planned days used`}
        />
        <span className="adm-health-count">
          {plan.daysOnSite} of {plan.daysPlanned} days
        </span>
      </div>
      {moneyLine ? <div className="adm-row-meta adm-health-money">{moneyLine}</div> : null}
    </>
  )
}

/** SOV % complete against the calendar, and billed-to-date against the contract. */
function SovLine({ job }: { job: JobHealth }) {
  const sov = job.sov
  if (!sov) {
    return (
      <div className="adm-row-meta">No SOV yet</div>
    )
  }
  const tone = sov.status ? TONE[sov.status] : null

  const contract = sov.contractCents
  const moneyLine =
    contract !== null
      ? `${formatCents(sov.completedCents)} billed of ${formatCents(contract)} · crew ${formatCents(sov.crewCents)} / Sconyers ${formatCents(sov.sconyersCents)}`
      : `${formatCents(sov.completedCents)} billed of ${formatCents(sov.scheduledCents)} scheduled · no contract amount yet`

  return (
    <>
      <div className="adm-health-bar">
        <Bar
          fill={sov.pct}
          tick={sov.elapsedShare}
          tone={tone}
          label={`${formatPct(sov.pct)} complete on the Schedule of Values`}
        />
        <span className="adm-health-count">{formatPct(sov.pct)} complete</span>
      </div>
      <div className="adm-row-meta adm-health-money">{moneyLine}</div>
    </>
  )
}
