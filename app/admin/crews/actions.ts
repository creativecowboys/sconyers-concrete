'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOffice } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export async function createCrew(formData: FormData) {
  await requireOffice()
  const name = text(formData, 'name')
  if (!name) redirect('/admin/crews?error=crew-name')

  const supabase = await createClient()
  const { error } = await supabase.from('crews').insert({ name })
  if (error) {
    console.error('[admin/crews] create crew failed:', error.message)
    redirect('/admin/crews?error=save')
  }

  revalidatePath('/admin/crews')
  redirect('/admin/crews')
}

/**
 * New feed token. The old subscription URL stops working immediately, which is
 * the point — it is what you do when a phone goes missing.
 */
export async function rotateFeedToken(formData: FormData) {
  await requireOffice()
  const id = text(formData, 'id')
  if (!id) redirect('/admin/crews')

  const supabase = await createClient()
  const { error } = await supabase
    .from('crews')
    .update({ feed_token: crypto.randomUUID() })
    .eq('id', id)

  if (error) console.error('[admin/crews] token rotation failed:', error.message)

  revalidatePath('/admin/crews')
  redirect('/admin/crews?rotated=1')
}

export async function createCrewEvent(formData: FormData) {
  const profile = await requireOffice()

  const crewId = text(formData, 'crew_id')
  const title = text(formData, 'title')
  const startsOn = text(formData, 'starts_on')

  if (!crewId || !title || !startsOn) redirect('/admin/crews?error=event')

  const jobId = text(formData, 'job_id')
  const endsOn = text(formData, 'ends_on')
  const startTime = text(formData, 'start_time')
  const endTime = text(formData, 'end_time')

  const supabase = await createClient()
  const { error } = await supabase.from('crew_events').insert({
    crew_id: crewId,
    job_id: jobId || null,
    title,
    location: text(formData, 'location') || null,
    notes: text(formData, 'notes') || null,
    starts_on: startsOn,
    ends_on: endsOn || null,
    start_time: startTime || null,
    end_time: endTime || null,
    created_by: profile.id,
  })

  if (error) {
    console.error('[admin/crews] create event failed:', error.message)
    redirect('/admin/crews?error=save')
  }

  revalidatePath('/admin/crews')
  redirect('/admin/crews')
}

export async function deleteCrewEvent(formData: FormData) {
  await requireOffice()
  const id = text(formData, 'id')
  if (!id) redirect('/admin/crews')

  const supabase = await createClient()
  const { error } = await supabase.from('crew_events').delete().eq('id', id)
  if (error) console.error('[admin/crews] delete event failed:', error.message)

  revalidatePath('/admin/crews')
  redirect('/admin/crews')
}
