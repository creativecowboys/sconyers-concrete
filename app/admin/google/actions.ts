'use server'

import { revalidatePath } from 'next/cache'
import { requireOffice } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import type { GoogleStatus } from '@/lib/admin/types'

/**
 * The Google Business Profile hand-off.
 *
 * Nothing here talks to Google. The Sconyers listing went back to unverified
 * when the address moved to 2290 Strawn Rd, and Google refuses every write —
 * photos included — until Heather or Chip records the verification video. So
 * this is a queue a human works, and the office marks a row posted once the
 * push has actually happened through Creative Cowboys' Search Atlas tooling.
 *
 * When the listing clears, the push is: file → public URL →
 * gbp_upsert_media_library_item → gbp_manage_media(action:"add") →
 * gbp_bulk_deploy_locations.
 */
async function setStatus(formData: FormData, status: GoogleStatus) {
  await requireOffice()

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('media_items')
    .update({
      google_status: status,
      google_posted_at: status === 'posted' ? new Date().toISOString() : null,
      google_error: null,
    })
    .eq('id', id)

  if (error) console.error('[admin/google] status update failed:', error.message)

  revalidatePath('/admin/google')
  revalidatePath('/admin/media')
  revalidatePath('/admin')
}

/** Someone pushed it to the listing by hand. Record that so it stops nagging. */
export async function markPosted(formData: FormData) {
  await setStatus(formData, 'posted')
}

/** Not going to Google after all. Stays in the library. */
export async function skipGoogle(formData: FormData) {
  await setStatus(formData, 'skipped')
}

/** Back in the queue — posted by mistake, or skipped and wanted after all. */
export async function requeueForGoogle(formData: FormData) {
  await setStatus(formData, 'queued')
}

/**
 * The caption that will go out with the photo on Google. Written here, in
 * advance, so the queue is genuinely ready to push the day the listing clears
 * rather than a pile of untitled photos nobody remembers.
 */
export async function saveCaption(formData: FormData) {
  await requireOffice()

  const id = formData.get('id')
  const caption = formData.get('caption')
  if (typeof id !== 'string' || !id) return

  const text = typeof caption === 'string' ? caption.trim() : ''

  const supabase = await createClient()
  const { error } = await supabase
    .from('media_items')
    .update({ caption: text || null })
    .eq('id', id)

  if (error) console.error('[admin/google] caption save failed:', error.message)

  revalidatePath('/admin/google')
  revalidatePath('/admin/media')
}
