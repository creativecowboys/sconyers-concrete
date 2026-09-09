'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOffice } from '@/lib/admin/auth'
import { JOB_STATUSES, type JobStatus } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function nullable(formData: FormData, key: string) {
  return text(formData, key) || null
}

function status(formData: FormData): JobStatus {
  const value = text(formData, 'status')
  return (JOB_STATUSES as readonly string[]).includes(value)
    ? (value as JobStatus)
    : 'active'
}

function payload(formData: FormData) {
  return {
    name: text(formData, 'name'),
    client_name: nullable(formData, 'client_name'),
    address: nullable(formData, 'address'),
    city: nullable(formData, 'city'),
    county: nullable(formData, 'county'),
    status: status(formData),
    start_date: nullable(formData, 'start_date'),
    end_date: nullable(formData, 'end_date'),
    notes: nullable(formData, 'notes'),
  }
}

export async function createJob(formData: FormData) {
  const profile = await requireOffice()
  const values = payload(formData)

  if (!values.name) redirect('/admin/jobs/new?error=name')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...values, created_by: profile.id })
    .select('id')
    .single()

  if (error) {
    console.error('[admin/jobs] create failed:', error.message)
    redirect('/admin/jobs/new?error=save')
  }

  revalidatePath('/admin/jobs')
  redirect(`/admin/jobs/${data.id}`)
}

export async function updateJob(formData: FormData) {
  await requireOffice()

  const id = text(formData, 'id')
  if (!id) redirect('/admin/jobs')

  const values = payload(formData)
  if (!values.name) redirect(`/admin/jobs/${id}/edit?error=name`)

  const supabase = await createClient()
  const { error } = await supabase.from('jobs').update(values).eq('id', id)

  if (error) {
    console.error('[admin/jobs] update failed:', error.message)
    redirect(`/admin/jobs/${id}/edit?error=save`)
  }

  revalidatePath('/admin/jobs')
  revalidatePath(`/admin/jobs/${id}`)
  redirect(`/admin/jobs/${id}`)
}
