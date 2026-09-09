'use server'

import { revalidatePath } from 'next/cache'
import { requireOffice, requireProfile } from '@/lib/admin/auth'
import { MEDIA_DESTINATIONS, type MediaDestination } from '@/lib/admin/types'
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

/**
 * `attempt` is echoed back from the form so the client can tell "this save
 * succeeded" apart from an older success after the form has been reopened.
 */
export type UpdateMediaState =
  | { ok: true; attempt: number }
  | { ok: false; error: string }
  | null

const NOT_LISTED = '__not_listed__'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Fix the labels on a photo after the fact — job, date taken, caption, and
 * where it is meant to go. Any signed-in staff member can do this on any
 * photo: "anyone is fine" (Dave, Sep 9 2026). Deleting stays office-only.
 *
 * Validates the same way the upload form does: a job and a date are required,
 * the destination has to be one of the four, and the job is linked to a job
 * row when the label matches one by name, otherwise it stays free text for the
 * office to tie up later. Changing the destination is enough to move the row
 * in or out of the Google queue — the database trigger handles that, so the
 * queue is right however the row got there.
 */
export async function updateMedia(
  _prev: UpdateMediaState,
  formData: FormData
): Promise<UpdateMediaState> {
  await requireProfile()

  const attempt = Number(text(formData, 'attempt')) || 0
  const id = text(formData, 'id')
  if (!id) return { ok: false, error: 'Something went wrong — reload the page and try again.' }

  const jobLabel = text(formData, 'job')
  if (!jobLabel || jobLabel === NOT_LISTED) {
    return { ok: false, error: 'Pick or type a job first.' }
  }

  const capturedOn = text(formData, 'captured_on')
  if (!ISO_DATE.test(capturedOn) || Number.isNaN(Date.parse(`${capturedOn}T00:00:00Z`))) {
    return { ok: false, error: 'Enter the day it was taken.' }
  }

  const destination = text(formData, 'destination')
  if (!(MEDIA_DESTINATIONS as readonly string[]).includes(destination)) {
    return { ok: false, error: 'Pick where this should go.' }
  }

  const caption = text(formData, 'caption')

  const supabase = await createClient()

  // The row as it stands, so the old job page can be refreshed too if the
  // photo moves between jobs.
  const { data: before, error: readError } = await supabase
    .from('media_items')
    .select('job_id')
    .eq('id', id)
    .maybeSingle<{ job_id: string | null }>()

  if (readError || !before) {
    return { ok: false, error: 'That file is no longer on file.' }
  }

  // Same linking rule as the upload form's matchJob(): an exact name match,
  // ignoring case, links the row to the job; anything else stays free text
  // with job_id null. Matched here rather than with ilike — PostgREST treats
  // `*` as a wildcard in ilike patterns and there is no way to escape it.
  const { data: jobRows } = await supabase.from('jobs').select('id, name').limit(1000)
  const wanted = jobLabel.toLowerCase()
  const job = ((jobRows ?? []) as { id: string; name: string }[]).find(
    (row) => row.name.toLowerCase() === wanted
  )

  const { error } = await supabase
    .from('media_items')
    .update({
      job_id: job?.id ?? null,
      job_label: jobLabel,
      captured_on: capturedOn,
      caption: caption || null,
      destination: destination as MediaDestination,
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/media] update failed:', error.message)
    return { ok: false, error: `Could not save: ${error.message}` }
  }

  revalidatePath('/admin/media')
  revalidatePath('/admin/google')
  revalidatePath('/admin')
  if (before.job_id) revalidatePath(`/admin/jobs/${before.job_id}`)
  if (job?.id && job.id !== before.job_id) revalidatePath(`/admin/jobs/${job.id}`)

  return { ok: true, attempt }
}
