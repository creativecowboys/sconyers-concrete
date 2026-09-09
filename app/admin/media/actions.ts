'use server'

import { revalidatePath } from 'next/cache'
import { requireOffice } from '@/lib/admin/auth'
import { MEDIA_BUCKET } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

/**
 * There is no approve/reject any more. Uploads are live the moment they land —
 * the one person adding jobsite photos is the same person who would have been
 * approving them, so the queue was ceremony. (Dave, Sep 9 2026.)
 *
 * Deleting is the one thing still limited to the office, in the UI and in row
 * level security both. It takes the file out of storage as well as the row, so
 * a photo that should not have gone up is genuinely gone.
 */
export async function deleteMedia(formData: FormData) {
  await requireOffice()

  const id = formData.get('id')
  const path = formData.get('storage_path')
  if (typeof id !== 'string' || !id) return

  const supabase = await createClient()

  if (typeof path === 'string' && path) {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path])
    // A missing file should not block removing the row it belongs to.
    if (error) console.error('[admin/media] file delete failed:', error.message)
  }

  const { error } = await supabase.from('media_items').delete().eq('id', id)
  if (error) console.error('[admin/media] row delete failed:', error.message)

  revalidatePath('/admin/media')
  revalidatePath('/admin/google')
  revalidatePath('/admin')
}
