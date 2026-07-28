import { Resend } from 'resend'
import { site } from '@/lib/site'
import { createGhlOpportunity } from '@/lib/ghl'

/** Field name -> label, in the order they should appear in the email. */
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  'first-name': 'First name',
  'last-name': 'Last name',
  company: 'Company',
  phone: 'Phone',
  email: 'Email',
  service: 'Service needed',
  timeline: 'Timeline',
  location: 'Project city / ZIP',
  'project-address': 'Project location',
  message: 'Project details',
}

const FIELD_ORDER = [
  'name',
  'first-name',
  'last-name',
  'company',
  'phone',
  'email',
  'service',
  'timeline',
  'location',
  'project-address',
  'message',
]

const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? site.email
// Must be @send.sconyersconcrete.com — that subdomain is what's verified in
// Resend (DKIM + SPF + MX), NOT the root domain. Sending from the root would be
// rejected. Verified 2026-07-28.
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ??
  'Sconyers Concrete Website <noreply@send.sconyersconcrete.com>'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Honeypot: bots fill every field they find.
  if (typeof body.company_website === 'string' && body.company_website.trim()) {
    return Response.json({ ok: true })
  }

  const get = (key: string) =>
    typeof body[key] === 'string' ? (body[key] as string).trim() : ''

  const email = get('email')
  const name = [get('name'), get('first-name'), get('last-name')]
    .filter(Boolean)
    .join(' ')
    .trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'A valid email address is required.' }, { status: 400 })
  }
  if (!name) {
    return Response.json({ error: 'Your name is required.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set — cannot send lead email.')
    return Response.json(
      { error: `Our form is temporarily offline. Please call ${site.phone}.` },
      { status: 500 }
    )
  }

  const source = get('source') || 'website'
  const rows = FIELD_ORDER.filter((key) => get(key)).map((key) => ({
    label: FIELD_LABELS[key],
    value: get(key),
  }))

  const text = [
    `New estimate request from the ${source} page.`,
    '',
    ...rows.map((row) => `${row.label}: ${row.value}`),
  ].join('\n')

  const html = `
    <h2 style="font-family:Arial,sans-serif;">New estimate request</h2>
    <p style="font-family:Arial,sans-serif;color:#555;">
      Submitted from the <strong>${escapeHtml(source)}</strong> page.
    </p>
    <table style="font-family:Arial,sans-serif;border-collapse:collapse;">
      ${rows
        .map(
          (row) => `<tr>
        <td style="padding:6px 12px 6px 0;vertical-align:top;color:#888;">${escapeHtml(row.label)}</td>
        <td style="padding:6px 0;vertical-align:top;">${escapeHtml(row.value).replace(/\n/g, '<br>')}</td>
      </tr>`
        )
        .join('')}
    </table>
  `

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `New estimate request — ${name} (${source})`,
      text,
      html,
    })

    if (error) {
      console.error('[contact] Resend rejected the message:', error)
      return Response.json(
        { error: `We couldn't send your message. Please call ${site.phone}.` },
        { status: 502 }
      )
    }

    // Email is away, so the lead is safe. Push it into GHL as well — deliberately
    // after the send and deliberately non-fatal: a GHL outage or misconfiguration
    // must never cost us a lead or show the caller an error.
    const ghl = await createGhlOpportunity({
      name,
      email,
      phone: get('phone'),
      company: get('company'),
      location: get('location'),
      service: get('service'),
      timeline: get('timeline'),
      message: get('message'),
      source,
    })
    if (!ghl.success && ghl.error !== 'not_configured') {
      console.error('[contact] lead emailed but GHL sync failed:', ghl.error)
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[contact] Unexpected failure sending lead email:', err)
    return Response.json(
      { error: `We couldn't send your message. Please call ${site.phone}.` },
      { status: 500 }
    )
  }
}
