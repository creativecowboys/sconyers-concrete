import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/admin/auth'
import { formatDateTime } from '@/lib/admin/format'
import { CHANGE_ORDER_STATUS_LABELS, type ChangeOrder } from '@/lib/admin/types'
import { MEDIA_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import SubmitButton from '../../_components/SubmitButton'
import { setChangeOrderStatus } from '../actions'

type Search = Record<string, string | string[] | undefined>

export default async function ChangeOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Search>
}) {
  const { id } = await params
  const search = await searchParams
  const justCreated = (Array.isArray(search.new) ? search.new[0] : search.new) === '1'

  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('change_orders')
    .select(
      'id, job_id, job_label, description, status, office_note, raised_by, raised_by_name, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle<ChangeOrder>()

  if (!order) notFound()

  const { data: photos } = await supabase
    .from('change_order_media')
    .select('id, storage_path, original_name')
    .eq('change_order_id', id)
    .order('created_at')

  const signed: Record<string, string> = {}
  if ((photos ?? []).length > 0) {
    const { data: urls } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(
        (photos ?? []).map((photo) => photo.storage_path),
        60 * 30
      )
    for (const entry of urls ?? []) {
      if (entry.path && entry.signedUrl) signed[entry.path] = entry.signedUrl
    }
  }

  return (
    <>
      <div className="adm-page-head">
        <div>
          <p className="adm-small adm-muted">
            <Link href="/admin/change-orders">← All changes</Link>
          </p>
          <h1>{order.job_label}</h1>
          <p>
            <span className="adm-badge">{CHANGE_ORDER_STATUS_LABELS[order.status]}</span>
          </p>
        </div>
      </div>

      {justCreated ? (
        <div className="adm-note adm-note-ok adm-mb">
          <strong>Sent.</strong> The office has it by email and it is on their
          list. You do not need to call it in.
        </div>
      ) : null}

      <div className="adm-note adm-mb">
        <strong>Internal record.</strong> This is the field telling the office
        something changed. It is not the change order issued to the general
        contractor, and nothing here has been sent to them.
      </div>

      <div className="adm-card">
        <dl className="adm-dl">
          <div>
            <dt>What changed</dt>
            <dd className="adm-multiline">{order.description}</dd>
          </div>
          <div>
            <dt>Raised by</dt>
            <dd>{order.raised_by_name || '—'}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>{formatDateTime(order.created_at)}</dd>
          </div>
          {order.job_id ? (
            <div>
              <dt>Job</dt>
              <dd>
                <Link href={`/admin/jobs/${order.job_id}`}>Open the job</Link>
              </dd>
            </div>
          ) : null}
          {order.office_note ? (
            <div>
              <dt>Office note</dt>
              <dd className="adm-multiline">{order.office_note}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {(photos ?? []).length > 0 ? (
        <>
          <h2 className="adm-mt-lg adm-mb">Photos</h2>
          <div className="adm-grid adm-grid-2">
            {(photos ?? []).map((photo) => {
              const url = signed[photo.storage_path]
              return url ? (
                <a key={photo.id} href={url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="adm-thumb"
                    src={url}
                    alt={photo.original_name ?? 'Field photo'}
                  />
                </a>
              ) : (
                <div key={photo.id} className="adm-thumb adm-thumb-fallback">
                  Preview unavailable
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      {profile.role === 'office' ? (
        <form action={setChangeOrderStatus} className="adm-card adm-mt-lg">
          <h2 className="adm-mb">Office</h2>
          <input type="hidden" name="id" value={order.id} />

          <label className="adm-field">
            <span className="adm-field-label">Status</span>
            <select name="status" defaultValue={order.status}>
              <option value="new">New</option>
              <option value="acknowledged">Seen by office</option>
              <option value="handled">Handled</option>
            </select>
          </label>

          <label className="adm-field">
            <span className="adm-field-label">
              Note
              <span className="adm-field-hint">
                What the office did with it. Internal.
              </span>
            </span>
            <textarea name="office_note" defaultValue={order.office_note ?? ''} />
          </label>

          <SubmitButton className="adm-btn adm-btn-primary adm-btn-block" pendingLabel="Saving…">
            Save
          </SubmitButton>
        </form>
      ) : null}
    </>
  )
}
