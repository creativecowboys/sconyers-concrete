import { get } from '@vercel/blob'
import { downloadFileName, pathnameFromLinkSegments } from '@/lib/plans'
import { verifyPlanSig } from '@/lib/plans-link'

/**
 * Opens one attached plan file from the private store. The link comes from the
 * lead email (/api/contact signs it); a wrong signature, a path that is not a
 * plan path, or a file that is gone all answer the same plain 404.
 */

type Params = { params: Promise<{ sig: string; path: string[] }> }

const NOT_FOUND_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
}

function notFound() {
  return new Response('Not found', { status: 404, headers: NOT_FOUND_HEADERS })
}

export async function GET(_request: Request, { params }: Params) {
  const { sig, path } = await params
  const pathname = pathnameFromLinkSegments(path ?? [])
  const secret = process.env.PLANS_LINK_SECRET?.trim() ?? ''
  if (!pathname || !secret || !verifyPlanSig(pathname, sig, secret)) return notFound()
  if (!process.env.BLOB_READ_WRITE_TOKEN) return notFound()

  let result: Awaited<ReturnType<typeof get>>
  try {
    result = await get(pathname, { access: 'private' })
  } catch (err) {
    console.error('[plans] could not read', pathname, err)
    return notFound()
  }
  if (!result || result.statusCode !== 200) return notFound()

  const { contentType, size } = result.blob
  const fileName = downloadFileName(pathname)
  // PDFs and pictures open in the browser; a ZIP downloads.
  const disposition = contentType === 'application/zip' ? 'attachment' : 'inline'

  return new Response(result.stream, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(size),
      'Content-Disposition': `${disposition}; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
