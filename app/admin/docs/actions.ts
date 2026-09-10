'use server'

import { revalidatePath } from 'next/cache'
import { displayName, requireOffice, requireProfile } from '@/lib/admin/auth'
import { DOC_MAX_BYTES, isAllowedDoc } from '@/lib/admin/docs'
import { DOCS_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export type RecordDocumentInput = {
  title: string
  storage_path: string
  mime_type: string | null
  size_bytes: number
  original_name: string
}

export type RecordDocumentResult = { ok: true } | { ok: false; message: string }

/**
 * Files the row for a document the browser has already put in the `docs`
 * bucket. The upload itself goes straight from the browser to Supabase
 * Storage — same reason as jobsite video, a Vercel function caps request
 * bodies at 4.5 MB — so this only records what landed.
 *
 * Runs as the signed-in user. RLS insists `uploaded_by` is them, and the
 * storage policy already refused any upload whose owner was not them, so the
 * path prefix check below is belt and braces.
 */
export async function recordDocument(input: RecordDocumentInput): Promise<RecordDocumentResult> {
  const profile = await requireProfile()

  const title = String(input.title ?? '').trim().slice(0, 200)
  const path = String(input.storage_path ?? '')
  const originalName = String(input.original_name ?? '').slice(0, 300)
  const size = Number(input.size_bytes)

  if (!title) return { ok: false, message: 'Give it a title.' }
  if (!path.startsWith(`${profile.id}/`)) {
    return { ok: false, message: 'That file path does not belong to you.' }
  }
  if (!isAllowedDoc(originalName)) {
    return { ok: false, message: 'That file type is not allowed.' }
  }
  if (!Number.isFinite(size) || size <= 0 || size > DOC_MAX_BYTES) {
    return { ok: false, message: 'Files have to be 25 MB or under.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('documents').insert({
    title,
    storage_path: path,
    mime_type: input.mime_type || null,
    size_bytes: size,
    original_name: originalName,
    uploaded_by: profile.id,
    uploaded_by_name: displayName(profile),
  })

  if (error) return { ok: false, message: error.message }

  revalidatePath('/admin/docs')
  revalidatePath('/admin')
  return { ok: true }
}

/**
 * Office only, in the UI and in row level security both. Takes the file out
 * of storage as well as the row, so a document that should not have gone up
 * is genuinely gone. Same shape as deleteMedia in app/admin/media/actions.ts.
 */
export async function deleteDocument(formData: FormData) {
  await requireOffice()

  const id = formData.get('id')
  const path = formData.get('storage_path')
  if (typeof id !== 'string' || !id) return

  const supabase = await createClient()

  if (typeof path === 'string' && path) {
    const { error } = await supabase.storage.from(DOCS_BUCKET).remove([path])
    // A missing file should not block removing the row it belongs to.
    if (error) console.error('[admin/docs] file delete failed:', error.message)
  }

  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) console.error('[admin/docs] row delete failed:', error.message)

  revalidatePath('/admin/docs')
  revalidatePath('/admin')
}
