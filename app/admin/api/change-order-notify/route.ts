import { Resend } from 'resend'
import { getProfile } from '@/lib/admin/auth'
import { formatDateTime } from '@/lib/admin/format'
import { site } from '@/lib/site'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Emails the office when the field flags a change. Same Resend setup the
 * contact form uses — the From address has to stay on the verified
 * send.sconyersconcrete.com subdomain.
 */
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ??
  'Sconyers Concrete Website <noreply@send.sconyersconcrete.com>'

function recipients() {
  const raw = process.env.CHANGE_ORDER_TO_EMAILS ?? process.env.CONTACT_TO_EMAIL ?? site.email
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return Response.json({ error: 'Not signed in.' }, { status: 401 })

  let body: { id?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Bad request.' }, { status: 400 })
  }

  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return Response.json({ error: 'Missing change order id.' }, { status: 400 })

  // Read it back through RLS as this user, so nobody can trigger an email
  // about a record they cannot see.
  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('change_orders')
    .select('id, job_label, description, raised_by_name, created_at, job_id')
    .eq('id', id)
    .maybeSingle()

  if (error || !order) {
    return Response.json({ error: 'Change order not found.' }, { status: 404 })
  }

  const { count: photoCount } = await supabase
    .from('change_order_media')
    .select('id', { count: 'exact', head: true })
    .eq('change_order_id', id)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[change-order] RESEND_API_KEY is not set — no email sent.')
    // The record is saved either way. Do not fail the field's submission over
    // a mail problem they can do nothing about.
    return Response.json({ ok: true, emailed: false })
  }

  const adminUrl = new URL(`/admin/change-orders/${order.id}`, request.url).toString()
  const raisedBy = order.raised_by_name || profile.email

  const text = [
    'A crew flagged a change from the field.',
    '',
    `Job: ${order.job_label}`,
    `Raised by: ${raisedBy}`,
    `When: ${formatDateTime(order.created_at)}`,
    `Photos attached in the admin: ${photoCount ?? 0}`,
    '',
    order.description,
    '',
    `Open it: ${adminUrl}`,
    '',
    'This is an internal note from the field. It is NOT the change order to',
    'the general contractor — the office still issues that.',
  ].join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a1a1a;">
      <h2 style="margin:0 0 4px;">Change flagged from the field</h2>
      <p style="margin:0 0 18px;color:#666;">
        Internal note. <strong>Not</strong> the change order to the general
        contractor &mdash; the office still issues that.
      </p>
      <table style="border-collapse:collapse;margin-bottom:18px;">
        <tr><td style="padding:4px 14px 4px 0;color:#888;">Job</td><td style="padding:4px 0;"><strong>${escapeHtml(order.job_label)}</strong></td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#888;">Raised by</td><td style="padding:4px 0;">${escapeHtml(raisedBy)}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#888;">When</td><td style="padding:4px 0;">${escapeHtml(formatDateTime(order.created_at))}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;color:#888;">Photos</td><td style="padding:4px 0;">${photoCount ?? 0}</td></tr>
      </table>
      <div style="white-space:pre-wrap;border-left:4px solid #cc1414;padding:2px 0 2px 14px;margin-bottom:18px;">${escapeHtml(order.description)}</div>
      <p><a href="${adminUrl}" style="background:#cc1414;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Open it in the admin</a></p>
    </div>
  `

  try {
    const resend = new Resend(apiKey)
    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients(),
      subject: `Change flagged — ${order.job_label} (${raisedBy})`,
      text,
      html,
    })

    if (sendError) {
      console.error('[change-order] Resend rejected the message:', sendError)
      return Response.json({ ok: true, emailed: false })
    }
  } catch (err) {
    console.error('[change-order] Unexpected failure sending the notification:', err)
    return Response.json({ ok: true, emailed: false })
  }

  return Response.json({ ok: true, emailed: true })
}
