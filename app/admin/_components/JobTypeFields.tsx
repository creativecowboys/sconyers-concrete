'use client'

import { useState } from 'react'
import {
  centsToInput,
  dollarsToCents,
  formatCents,
  parsePercent,
  splitContract,
} from '@/lib/admin/money'
import { JOB_TYPES, JOB_TYPE_LABELS, type Job, type JobType } from '@/lib/admin/types'

type Defaults = Pick<
  Job,
  'job_type' | 'day_rate_cents' | 'days_bid' | 'contract_cents' | 'crew_share_pct'
>

/**
 * The top of the job form: which way this job is billed, and the two or three
 * numbers that go with it. Chip, Sep 15 2026 — day rate is labor only and bid
 * as crew-days; 80/20 is a won contract split with the crew.
 *
 * Only the fields for the chosen type are in the DOM, so the action never
 * sees a contract amount on a day-rate job. Everything is a plain named
 * input; this component just decides which ones show and does the live
 * arithmetic underneath them.
 */
export default function JobTypeFields({ job }: { job?: Defaults }) {
  const [type, setType] = useState<JobType>(job?.job_type ?? 'day_rate')
  const [rate, setRate] = useState(centsToInput(job?.day_rate_cents))
  const [days, setDays] = useState(job?.days_bid == null ? '' : String(job.days_bid))
  const [contract, setContract] = useState(centsToInput(job?.contract_cents))
  const [share, setShare] = useState(String(job?.crew_share_pct ?? 80))

  const rateCents = dollarsToCents(rate)
  const daysBid = /^\d+$/.test(days.trim()) ? Number(days.trim()) : null
  const contractCents = dollarsToCents(contract)
  const sharePct = parsePercent(share)
  const split =
    contractCents !== null && sharePct !== null ? splitContract(contractCents, sharePct) : null

  return (
    <>
      <fieldset className="adm-field adm-fieldset">
        <legend className="adm-field-label">
          Job type
          <span className="adm-field-hint">
            Day rate: a set rate per crew-day, labor only. 80/20: a won contract,
            80% to the crew, 20% to Sconyers, billed off a Schedule of Values.
          </span>
        </legend>
        <div className="adm-seg" role="radiogroup" aria-label="Job type">
          {JOB_TYPES.map((value) => (
            <label key={value} className="adm-seg-opt">
              <input
                type="radio"
                name="job_type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="adm-sr"
              />
              <span>{JOB_TYPE_LABELS[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === 'day_rate' ? (
        <>
          <div className="adm-grid adm-grid-2">
            <label className="adm-field">
              <span className="adm-field-label">
                Day rate ($)
                <span className="adm-field-hint">Per crew-day, labor only.</span>
              </span>
              <input
                type="number"
                name="day_rate"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
            </label>
            <label className="adm-field">
              <span className="adm-field-label">
                Days bid
                <span className="adm-field-hint">Crew-days the job was bid at.</span>
              </span>
              <input
                type="number"
                name="days_bid"
                inputMode="numeric"
                min={0}
                step={1}
                placeholder="0"
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </label>
          </div>
          <p className="adm-split" aria-live="polite">
            {rateCents !== null && daysBid !== null && daysBid > 0 ? (
              <>
                Bid total <strong>{formatCents(rateCents * daysBid)}</strong> — {daysBid}{' '}
                {daysBid === 1 ? 'day' : 'days'} at {formatCents(rateCents)}
              </>
            ) : (
              'Enter the rate and the days bid to see the bid total.'
            )}
          </p>
        </>
      ) : (
        <>
          <div className="adm-grid adm-grid-2">
            <label className="adm-field">
              <span className="adm-field-label">
                Contract amount ($)
                <span className="adm-field-hint">The contract Sconyers won.</span>
              </span>
              <input
                type="number"
                name="contract"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0"
                value={contract}
                onChange={(event) => setContract(event.target.value)}
              />
            </label>
            <label className="adm-field">
              <span className="adm-field-label">
                Crew share (%)
                <span className="adm-field-hint">Usually 80. Sconyers keeps the rest.</span>
              </span>
              <input
                type="number"
                name="crew_share_pct"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.5"
                value={share}
                onChange={(event) => setShare(event.target.value)}
              />
            </label>
          </div>
          <p className="adm-split" aria-live="polite">
            {split && sharePct !== null ? (
              <>
                Crew <strong>{formatCents(split.crew)}</strong> ({sharePct}%) · Sconyers{' '}
                <strong>{formatCents(split.sconyers)}</strong> ({Math.round((100 - sharePct) * 100) / 100}%)
              </>
            ) : (
              'Enter the contract amount to see the split.'
            )}
          </p>
        </>
      )}
    </>
  )
}
