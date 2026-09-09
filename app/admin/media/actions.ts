'use server'

import { revalidatePath } from 'next/cache'
import { requireOffice } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

async function review(formData: FormData, status: 'approved' | 'rejected') {
  const profile = await requireOffice()

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) return

  const note = formData.get('review_note')
  const supabase = await createClient()

  const { error } = await supabase
    .from('media_items')
    .update({
      status,
      review_note: typeof note === 'string' && note.trim() ? note.trim() : null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) console.error('[admin/media] review failed:', error.message)

  revalidatePath('/admin/media')
  revalidatePath('/admin')
}

/**
 * Approving is the gate on anything public. Nothing is pushed to the website
 * gallery or to Google automatically — approval marks it cleared for a human to
 * publish, which is deliberate: Sconyers' Google listing is still unverified,
 * and jobsite photos can catch things a client would not want published.
 */
export async function approveMedia(formData: FormData) {
  await review(formData, 'approved')
}

export async function rejectMedia(formData: FormData) {
  await review(formData, 'rejected')
}
