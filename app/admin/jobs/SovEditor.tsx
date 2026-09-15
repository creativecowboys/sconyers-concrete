'use client'

import { useActionState, useState } from 'react'
import { centsToInput, dollarsToCents, formatCents } from '@/lib/admin/money'
import { formatPct, lineTotals, summarize, type SovInput } from '@/lib/admin/sov'
import type { SovLine } from '@/lib/admin/types'
import { saveSov, type SaveSovState } from './actions'

/**
 * The Schedule of Values on an 80/20 job, laid out like the AIA G703 sheet:
 * item, description, scheduled value, previous, this period, stored, then the
 * derived total completed, % complete, balance to finish and retainage.
 *
 * The office edits in place — every cell is a plain input, the derived
 * columns and the footer recompute as you type, and one Save button writes
 * the whole table (same shape as the rest of the admin: a form, a server
 * action, a note that says it landed). The field sees the same table read-only.
 *
 * Line ids are minted here with crypto.randomUUID(), so a line saved twice is
 * the same row twice and the action can upsert instead of guessing.
 */

type Draft = {
  id: string
  item_no: string
  description: string
  scheduled: string
  previous: string
  thisPeriod: string
  stored: string
  retainage: string
}

const COLUMNS = [
  ['Item #', 'adm-sov-item'],
  ['Description', 'adm-sov-desc'],
  ['Scheduled value', 'adm-sov-money'],
  ['Previous', 'adm-sov-money'],
  ['This period', 'adm-sov-money'],
  ['Stored', 'adm-sov-money'],
  ['Total completed', 'adm-sov-money adm-sov-derived'],
  ['%', 'adm-sov-pct adm-sov-derived'],
  ['Balance to finish', 'adm-sov-money adm-sov-derived'],
  ['Retainage %', 'adm-sov-pct'],
  ['Retainage', 'adm-sov-money adm-sov-derived'],
] as const

function toDraft(line: SovLine): Draft {
  return {
    id: line.id,
    item_no: line.item_no ?? '',
    description: line.description,
    scheduled: centsToInput(line.scheduled_value_cents),
    previous: centsToInput(line.previous_completed_cents),
    thisPeriod: centsToInput(line.this_period_cents),
    stored: centsToInput(line.stored_cents),
    retainage: line.retainage_pct === 0 ? '' : String(line.retainage_pct),
  }
}

function toInput(draft: Draft): SovInput {
  const pct = Number(draft.retainage.trim())
  return {
    scheduled_value_cents: dollarsToCents(draft.scheduled) ?? 0,
    previous_completed_cents: dollarsToCents(draft.previous) ?? 0,
    this_period_cents: dollarsToCents(draft.thisPeriod) ?? 0,
    stored_cents: dollarsToCents(draft.stored) ?? 0,
    retainage_pct: Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0,
  }
}

function newDraft(index: number): Draft {
  return {
    id: crypto.randomUUID(),
    item_no: String(index + 1),
    description: '',
    scheduled: '',
    previous: '',
    thisPeriod: '',
    stored: '',
    retainage: '',
  }
}

export default function SovEditor({
  jobId,
  lines,
  canEdit,
}: {
  jobId: string
  lines: SovLine[]
  canEdit: boolean
}) {
  const [drafts, setDrafts] = useState<Draft[]>(() => lines.map(toDraft))
  const [dirty, setDirty] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [state, formAction, pending] = useActionState<SaveSovState, FormData>(saveSov, null)

  const inputs = drafts.map(toInput)
  const totals = summarize(inputs)
  const saved = state?.ok === true && state.attempt === attempt && !dirty
  const error = state && !state.ok && !dirty ? state.error : null

  function patch(id: string, change: Partial<Draft>) {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...change } : draft)))
    setDirty(true)
  }

  function move(index: number, by: -1 | 1) {
    setDrafts((current) => {
      const next = [...current]
      const target = index + by
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setDirty(true)
  }

  function remove(id: string) {
    setDrafts((current) => current.filter((draft) => draft.id !== id))
    setDirty(true)
  }

  function add() {
    setDrafts((current) => [...current, newDraft(current.length)])
    setDirty(true)
  }

  const payload = JSON.stringify(
    drafts.map((draft) => ({ id: draft.id, item_no: draft.item_no, description: draft.description, ...toInput(draft) }))
  )

  const summary = (
    <p className="adm-sov-summary">
      {drafts.length === 0 ? (
        'No lines yet.'
      ) : (
        <>
          <strong>{formatCents(totals.completed)}</strong> completed of{' '}
          <strong>{formatCents(totals.scheduled)}</strong> scheduled ·{' '}
          <strong>{formatPct(totals.pct)}</strong> complete · {formatCents(totals.balance)} to finish
          {totals.retainage > 0 ? <> · {formatCents(totals.retainage)} retainage held</> : null}
        </>
      )}
    </p>
  )

  if (!canEdit) {
    return (
      <div className="adm-card">
        {summary}
        {drafts.length > 0 ? (
          <div className="adm-table-wrap">
            <span className="adm-table-hint adm-small adm-muted">Scroll sideways for the rest of the columns.</span>
            <table className="adm-table adm-sov">
              <thead>
                <tr>
                  {COLUMNS.map(([label, cls]) => (
                    <th key={label} className={cls}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft, index) => {
                  const t = lineTotals(inputs[index])
                  return (
                    <tr key={draft.id}>
                      <td className="adm-sov-item">{draft.item_no || '—'}</td>
                      <td className="adm-sov-desc">{draft.description || '—'}</td>
                      <td className="adm-sov-money">{formatCents(inputs[index].scheduled_value_cents)}</td>
                      <td className="adm-sov-money">{formatCents(inputs[index].previous_completed_cents)}</td>
                      <td className="adm-sov-money">{formatCents(inputs[index].this_period_cents)}</td>
                      <td className="adm-sov-money">{formatCents(inputs[index].stored_cents)}</td>
                      <td className="adm-sov-money adm-sov-derived">{formatCents(t.completed)}</td>
                      <td className="adm-sov-pct adm-sov-derived">{formatPct(t.pct)}</td>
                      <td className="adm-sov-money adm-sov-derived">{formatCents(t.balance)}</td>
                      <td className="adm-sov-pct">{inputs[index].retainage_pct}%</td>
                      <td className="adm-sov-money adm-sov-derived">{formatCents(t.retainage)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <Totals totals={totals} />
            </table>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <form
      action={formAction}
      className="adm-card"
      onSubmit={() => {
        setAttempt((n) => n + 1)
        setDirty(false)
      }}
    >
      <input type="hidden" name="job_id" value={jobId} />
      {/* attempt + 1: the state update above lands after the form is read. */}
      <input type="hidden" name="attempt" value={attempt + 1} />
      <input type="hidden" name="lines" value={payload} />

      {summary}

      {error ? <div className="adm-note adm-note-bad adm-mb">{error}</div> : null}
      {saved ? <div className="adm-note adm-note-ok adm-mb">Schedule of Values saved.</div> : null}

      {drafts.length === 0 ? (
        <div className="adm-empty adm-mb">
          No lines yet. Add the first one — each line is one item off the Schedule of Values.
        </div>
      ) : (
        <div className="adm-table-wrap">
          <span className="adm-table-hint adm-small adm-muted">Scroll sideways for the rest of the columns.</span>
          <table className="adm-table adm-sov">
            <thead>
              <tr>
                {COLUMNS.map(([label, cls]) => (
                  <th key={label} className={cls}>
                    {label}
                  </th>
                ))}
                <th className="adm-sov-actions">
                  <span className="adm-sr">Reorder or remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft, index) => {
                const t = lineTotals(inputs[index])
                return (
                  <tr key={draft.id}>
                    <td className="adm-sov-item">
                      <input
                        type="text"
                        aria-label={`Line ${index + 1} item number`}
                        value={draft.item_no}
                        onChange={(event) => patch(draft.id, { item_no: event.target.value })}
                      />
                    </td>
                    <td className="adm-sov-desc">
                      <input
                        type="text"
                        aria-label={`Line ${index + 1} description`}
                        placeholder="Description of work"
                        value={draft.description}
                        onChange={(event) => patch(draft.id, { description: event.target.value })}
                      />
                    </td>
                    {(
                      [
                        ['scheduled', 'scheduled value'],
                        ['previous', 'previously completed'],
                        ['thisPeriod', 'completed this period'],
                        ['stored', 'materials stored'],
                      ] as const
                    ).map(([key, label]) => (
                      <td key={key} className="adm-sov-money">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="0"
                          aria-label={`Line ${index + 1} ${label}`}
                          value={draft[key]}
                          onChange={(event) => patch(draft.id, { [key]: event.target.value })}
                        />
                      </td>
                    ))}
                    <td className="adm-sov-money adm-sov-derived">{formatCents(t.completed)}</td>
                    <td className="adm-sov-pct adm-sov-derived">{formatPct(t.pct)}</td>
                    <td className="adm-sov-money adm-sov-derived">{formatCents(t.balance)}</td>
                    <td className="adm-sov-pct">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="0.5"
                        placeholder="0"
                        aria-label={`Line ${index + 1} retainage percent`}
                        value={draft.retainage}
                        onChange={(event) => patch(draft.id, { retainage: event.target.value })}
                      />
                    </td>
                    <td className="adm-sov-money adm-sov-derived">{formatCents(t.retainage)}</td>
                    <td className="adm-sov-actions">
                      <button
                        type="button"
                        className="adm-btn adm-btn-cell"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move line ${index + 1} up`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-cell"
                        onClick={() => move(index, 1)}
                        disabled={index === drafts.length - 1}
                        aria-label={`Move line ${index + 1} down`}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-cell"
                        onClick={() => remove(draft.id)}
                        aria-label={`Remove line ${index + 1}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <Totals totals={totals} actions />
          </table>
        </div>
      )}

      <div className="adm-btn-row adm-mt">
        <button type="button" className="adm-btn adm-btn-sm" onClick={add} disabled={pending}>
          Add line
        </button>
        <button
          type="submit"
          className="adm-btn adm-btn-sm adm-btn-primary"
          disabled={pending || (!dirty && !error)}
        >
          {pending ? 'Saving…' : 'Save Schedule of Values'}
        </button>
      </div>
    </form>
  )
}

function Totals({ totals, actions }: { totals: ReturnType<typeof summarize>; actions?: boolean }) {
  return (
    <tfoot>
      <tr>
        <td className="adm-sov-item" />
        <td className="adm-sov-desc">Totals</td>
        <td className="adm-sov-money">{formatCents(totals.scheduled)}</td>
        <td className="adm-sov-money">{formatCents(totals.previous)}</td>
        <td className="adm-sov-money">{formatCents(totals.thisPeriod)}</td>
        <td className="adm-sov-money">{formatCents(totals.stored)}</td>
        <td className="adm-sov-money adm-sov-derived">{formatCents(totals.completed)}</td>
        <td className="adm-sov-pct adm-sov-derived">{formatPct(totals.pct)}</td>
        <td className="adm-sov-money adm-sov-derived">{formatCents(totals.balance)}</td>
        <td className="adm-sov-pct" />
        <td className="adm-sov-money adm-sov-derived">{formatCents(totals.retainage)}</td>
        {actions ? <td className="adm-sov-actions" /> : null}
      </tr>
    </tfoot>
  )
}
