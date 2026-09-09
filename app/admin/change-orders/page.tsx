import Link from 'next/link'
import { requireProfile } from '@/lib/admin/auth'
import { formatDateTime } from '@/lib/admin/format'
import {
  CHANGE_ORDER_STATUS_LABELS,
  type ChangeOrder,
  type ChangeOrderStatus,
} from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'

type Search = Record<string, string | string[] | undefined>

const TABS: { value: 'open' | ChangeOrderStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'handled', label: 'Handled' },
]

function badgeClass(status: ChangeOrderStatus) {
  if (status === 'new') return 'adm-badge adm-badge-bad'
  if (status === 'acknowledged') return 'adm-badge adm-badge-warn'
  return 'adm-badge adm-badge-ok'
}

export default async function ChangeOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const profile = await requireProfile()
  const params = await searchParams
  const raw = Array.isArray(params.view) ? params.view[0] : params.view
  const view = raw === 'handled' ? 'handled' : 'open'

  const supabase = await createClient()
  let request = supabase
    .from('change_orders')
    .select('id, job_id, job_label, description, status, raised_by_name, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(100)

  request =
    view === 'handled'
      ? request.eq('status', 'handled')
      : request.in('status', ['new', 'acknowledged'])

  const { data, error } = await request
  const orders = (data ?? []) as ChangeOrder[]

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Changes from the field</h1>
          <p>
            {profile.role === 'office'
              ? 'What the crews have flagged. Internal records — the official change order to the GC still comes from the office.'
              : 'What you have flagged to the office.'}
          </p>
        </div>
        <Link href="/admin/change-orders/new" className="adm-btn adm-btn-primary">
          Flag a change
        </Link>
      </div>

      <div className="adm-btn-row adm-mb">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/change-orders?view=${tab.value}`}
            className={
              tab.value === view ? 'adm-btn adm-btn-sm adm-btn-primary' : 'adm-btn adm-btn-sm'
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="adm-note adm-note-bad">
          <strong>Could not load these.</strong> {error.message}
        </div>
      ) : orders.length === 0 ? (
        <div className="adm-empty">
          {view === 'open' ? 'Nothing open.' : 'Nothing handled yet.'}
        </div>
      ) : (
        <div className="adm-stack">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/change-orders/${order.id}`}
              className="adm-row"
            >
              <div className="adm-row-title">
                <span>{order.job_label}</span>
                <span className={badgeClass(order.status)}>
                  {CHANGE_ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <div className="adm-row-meta">
                {order.description.length > 120
                  ? `${order.description.slice(0, 120)}…`
                  : order.description}
              </div>
              <div className="adm-row-meta">
                {order.raised_by_name || 'Someone'} · {formatDateTime(order.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
