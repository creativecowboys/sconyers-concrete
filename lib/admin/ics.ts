/**
 * Minimal iCalendar writer for the crew feeds.
 *
 * Deliberately not a Google Calendar API integration: a signed .ics URL is
 * subscribed to once in Google, Apple or Outlook and then stays current
 * forever, with no OAuth, no Google Cloud project and nothing to re-authorise
 * when a phone is replaced.
 */

const TZ = 'America/New_York'

/** How far `date` is from UTC in the given zone, in minutes. */
function zoneOffsetMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second')
  )
  return (asUtc - date.getTime()) / 60000
}

/**
 * A wall-clock date+time in Georgia, as a real instant.
 * Offsets are resolved twice so an event sitting on a DST changeover does not
 * land an hour out.
 */
function georgiaWallClockToUtc(dateOnly: string, time: string) {
  const naive = new Date(`${dateOnly}T${time}Z`)
  let result = new Date(naive.getTime() - zoneOffsetMinutes(naive) * 60000)
  result = new Date(naive.getTime() - zoneOffsetMinutes(result) * 60000)
  return result
}

function utcStamp(date: Date) {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
}

function dateStamp(dateOnly: string) {
  return dateOnly.slice(0, 10).replace(/-/g, '')
}

/** The day after `dateOnly`, because DTEND on an all-day event is exclusive. */
function nextDay(dateOnly: string) {
  const date = new Date(`${dateOnly}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** RFC 5545 wants lines folded at 75 octets, continued with a leading space. */
function fold(line: string) {
  if (line.length <= 74) return line
  const chunks: string[] = [line.slice(0, 74)]
  let rest = line.slice(74)
  while (rest.length > 73) {
    chunks.push(` ${rest.slice(0, 73)}`)
    rest = rest.slice(73)
  }
  if (rest) chunks.push(` ${rest}`)
  return chunks.join('\r\n')
}

export type IcsEvent = {
  id: string
  title: string
  location?: string | null
  notes?: string | null
  startsOn: string
  endsOn?: string | null
  startTime?: string | null
  endTime?: string | null
  updatedAt?: string | null
}

export function buildIcs(calendarName: string, events: IcsEvent[], host: string) {
  const now = utcStamp(new Date())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sconyers Concrete//Crew Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    `X-WR-TIMEZONE:${TZ}`,
    // Most clients poll a subscribed feed on their own schedule; this is a hint.
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ]

  for (const event of events) {
    const uid = `${event.id}@${host}`
    const stamp = event.updatedAt ? utcStamp(new Date(event.updatedAt)) : now

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`LAST-MODIFIED:${stamp}`)

    if (event.startTime) {
      const start = georgiaWallClockToUtc(event.startsOn, event.startTime)
      const end = event.endTime
        ? georgiaWallClockToUtc(event.endsOn || event.startsOn, event.endTime)
        : new Date(start.getTime() + 8 * 60 * 60 * 1000)
      lines.push(`DTSTART:${utcStamp(start)}`)
      lines.push(`DTEND:${utcStamp(end)}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dateStamp(event.startsOn)}`)
      lines.push(`DTEND;VALUE=DATE:${dateStamp(nextDay(event.endsOn || event.startsOn))}`)
    }

    lines.push(fold(`SUMMARY:${escapeText(event.title)}`))
    if (event.location) lines.push(fold(`LOCATION:${escapeText(event.location)}`))
    if (event.notes) lines.push(fold(`DESCRIPTION:${escapeText(event.notes)}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}
