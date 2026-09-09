import type { NextRequest } from 'next/server'
import { buildIcs, type IcsEvent } from '@/lib/admin/ics'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type FeedRow = {
  crew_name: string
  event_id: string
  title: string
  location: string | null
  notes: string | null
  starts_on: string
  ends_on: string | null
  start_time: string | null
  end_time: string | null
  updated_at: string | null
}

/**
 * Public crew calendar feed. Deliberately outside /admin, because Google,
 * Apple and Outlook fetch it with no session — the unguessable token in the URL
 * is the authentication, which is why the office can rotate it.
 *
 * Reads through the crew_calendar_feed() SECURITY DEFINER function, so anon
 * gets exactly these rows for a matching token and nothing else.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token: raw } = await context.params
  const token = raw.replace(/\.ics$/i, '')

  if (!UUID.test(token)) {
    return new Response('Not found', { status: 404 })
  }

  if (!isSupabaseConfigured()) {
    return new Response('Calendar is not configured yet.', { status: 503 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('crew_calendar_feed', { p_token: token })

  if (error) {
    console.error('[crew-calendar] feed lookup failed:', error.message)
    return new Response('Calendar unavailable', { status: 502 })
  }

  const rows = (data ?? []) as FeedRow[]
  // An unknown token and an empty crew look the same on purpose — a wrong token
  // should not confirm that some other crew exists.
  const crewName = rows[0]?.crew_name ?? 'Sconyers Crew'

  const events: IcsEvent[] = rows.map((row) => ({
    id: row.event_id,
    title: row.title,
    location: row.location,
    notes: row.notes,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    startTime: row.start_time,
    endTime: row.end_time,
    updatedAt: row.updated_at,
  }))

  const body = buildIcs(`Sconyers — ${crewName}`, events, 'sconyersconcrete.com')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="sconyers-crew.ics"',
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
