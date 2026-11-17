import { head, issueSignedToken, presignUrl } from '@vercel/blob'
import { pathnameFromLinkSegments } from '@/lib/plans'
import { verifyPlanSig } from '@/lib/plans-link'

/**
 * Opens one attached plan file from the private store. The link comes from the
 * lead email (/api/contact signs it). A good link is sent on (302) to a
 * download address on the Blob store that works for 30 minutes; each click
 * makes a fresh one. The file comes straight from storage, not through this
 * function: a function has 300 seconds on this project, and a 500 MB file on
 * a slow connection takes longer than that.
 *
 * A wrong signature, a path that is not a plan path, or a file that is gone
 * (deleted after a year) all answer a plain 404.
 */

type Params = { params: Promise<{ sig: string; path: string[] }> }

const LINK_MINUTES = 30

const PLAIN_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
}

function notFound() {
  return new Response(
    'File not found. Plan files are kept for one year after they are sent.',
    { status: 404, headers: { ...PLAIN_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } }
  )
}

export async function GET(_request: Request, { params }: Params) {
  const { sig, path } = await params
  const pathname = pathnameFromLinkSegments(path ?? [])
  const secret = process.env.PLANS_LINK_SECRET?.trim() ?? ''
  if (!pathname || !secret || !verifyPlanSig(pathname, sig, secret)) return notFound()
  if (!process.env.BLOB_READ_WRITE_TOKEN) return notFound()

  try {
    await head(pathname)
  } catch {
    return notFound()
  }

  try {
    const token = await issueSignedToken({
      pathname,
      operations: ['get'],
      validUntil: Date.now() + LINK_MINUTES * 60 * 1000,
    })
    const { presignedUrl } = await presignUrl(token, { operation: 'get', pathname, access: 'private' })
    return new Response(null, { status: 302, headers: { ...PLAIN_HEADERS, Location: presignedUrl } })
  } catch (err) {
    console.error('[plans] could not make a download address for', pathname, err)
    return new Response('The file could not be opened right now. Please try again.', {
      status: 503,
      headers: { ...PLAIN_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
