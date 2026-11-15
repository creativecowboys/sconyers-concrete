import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import {
  PLAN_MAX_BYTES,
  planClientPayloadOk,
  planContentTypeForPathname,
} from '@/lib/plans'

/**
 * Hands the estimate form a one-file upload token for the private plans store.
 * The browser then uploads straight to Vercel Blob (a function only takes
 * 4.5 MB of request body). The token itself is the guard: one path under
 * plans/, the one content type that path's extension allows, 50 MB at most,
 * a random suffix on the name, no overwrite, valid for an hour.
 *
 * No upload-completed callback: /api/contact checks the files itself when the
 * form is sent, so nothing here depends on Vercel calling back in.
 */

const WINDOW_MS = 10 * 60 * 1000
/** Tokens one IP may ask for per window. One form is 5 at most; this allows retries. */
const MAX_PER_WINDOW = 20
const recent = new Map<string, number[]>()

/** Per warm instance only, so a bump in the road for a bot, not a wall. */
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  hits.push(now)
  recent.set(ip, hits)
  if (recent.size > 5000) {
    for (const [key, times] of recent) {
      if (!times.some((t) => now - t < WINDOW_MS)) recent.delete(key)
    }
  }
  return hits.length > MAX_PER_WINDOW
}

function clientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

/** Only the site's own pages ask for tokens; browsers always send Origin on a POST. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

class Refused extends Error {}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[plans] BLOB_READ_WRITE_TOKEN is not set; plan uploads are off.')
    return Response.json({ error: 'Uploads are not available right now.' }, { status: 503 })
  }
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Not allowed.' }, { status: 403 })
  }
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: 'Too many uploads. Try again in a few minutes.' }, { status: 429 })
  }

  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  // Only token requests. We never register an upload-completed callback.
  if (body?.type !== 'blob.generate-client-token') {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const contentType = planContentTypeForPathname(pathname)
        if (!contentType) throw new Refused('That file type can’t be attached.')
        if (!planClientPayloadOk(clientPayload)) throw new Refused('Too many files.')
        return {
          allowedContentTypes: [contentType],
          maximumSizeInBytes: PLAN_MAX_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 60 * 60 * 1000,
        }
      },
    })
    return Response.json(result)
  } catch (err) {
    if (err instanceof Refused) {
      return Response.json({ error: err.message }, { status: 400 })
    }
    console.error('[plans] could not issue an upload token:', err)
    return Response.json({ error: 'Upload could not start.' }, { status: 500 })
  }
}
