// Server side of "Attach plans": check what a form submission says it
// attached against the Blob store and turn each real file into a signed link.
// Used by /api/contact only.

import { head } from '@vercel/blob'
import {
  PLAN_MAX_BYTES,
  formatBytes,
  parseAttachments,
  planContentTypeForPathname,
  planLinkPath,
} from '@/lib/plans'
import { signPlanPath } from '@/lib/plans-link'

export type PlanAttachment = {
  name: string
  size: number
  /** "2.4 MB" */
  sizeLabel: string
  /** Signed download link, or null when PLANS_LINK_SECRET is not set. */
  url: string | null
}

const HEAD_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/**
 * The files a submission really attached. Never throws: a Blob hiccup costs
 * the attachment list, never the lead. `missing` counts paths that were sent
 * but are not in the store (or could not be checked).
 */
export async function resolveAttachments(
  raw: unknown,
  baseUrl: string
): Promise<{ files: PlanAttachment[]; missing: number }> {
  const { items, dropped } = parseAttachments(raw)
  if (!items.length) return { files: [], missing: dropped }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[plans] BLOB_READ_WRITE_TOKEN is not set; cannot check attachments.')
    return { files: [], missing: items.length + dropped }
  }
  const secret = process.env.PLANS_LINK_SECRET?.trim() || ''
  if (!secret) {
    console.error('[plans] PLANS_LINK_SECRET is not set; the lead email will list files without links.')
  }

  const checks = await Promise.allSettled(
    items.map((item) => withTimeout(head(item.pathname), HEAD_TIMEOUT_MS))
  )

  const files: PlanAttachment[] = []
  let missing = dropped
  checks.forEach((check, i) => {
    const item = items[i]
    if (check.status !== 'fulfilled') {
      console.error('[plans] attachment not found or not checkable:', item.pathname, check.reason)
      missing++
      return
    }
    // The upload token already limits both, but never link a file that slipped past it.
    if (
      check.value.size > PLAN_MAX_BYTES ||
      check.value.contentType !== planContentTypeForPathname(item.pathname)
    ) {
      console.error('[plans] attachment outside the limits, left out:', item.pathname, check.value.size, check.value.contentType)
      missing++
      return
    }
    files.push({
      name: item.name,
      size: check.value.size,
      sizeLabel: formatBytes(check.value.size),
      url: secret ? `${baseUrl}${planLinkPath(item.pathname, signPlanPath(item.pathname, secret))}` : null,
    })
  })
  return { files, missing }
}
