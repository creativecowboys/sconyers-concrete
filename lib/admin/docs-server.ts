import type { SupabaseClient } from '@supabase/supabase-js'
import { DOCS_BUCKET } from '@/lib/supabase/env'
import type { DocumentRow } from './types'

/**
 * Short-lived signed URLs for a list of documents. The bucket is private, so
 * nothing is reachable without one; these expire in half an hour, which is
 * long enough to open a PDF on a phone and short enough that a forwarded link
 * goes stale. Server-only — it takes the cookie-bound client.
 */
export async function signDocumentUrls(
  supabase: SupabaseClient,
  docs: Pick<DocumentRow, 'storage_path'>[]
): Promise<Record<string, string>> {
  const signed: Record<string, string> = {}
  if (docs.length === 0) return signed

  const { data } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrls(
      docs.map((doc) => doc.storage_path),
      60 * 30
    )
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) signed[entry.path] = entry.signedUrl
  }
  return signed
}
