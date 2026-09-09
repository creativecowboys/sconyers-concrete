import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOffice } from '@/lib/admin/auth'
import type { Job } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'
import JobForm from '../../../_components/JobForm'
import { updateJob } from '../../actions'

type Search = Record<string, string | string[] | undefined>

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Search>
}) {
  await requireOffice()
  const { id } = await params
  const search = await searchParams
  const error = Array.isArray(search.error) ? search.error[0] : search.error

  const supabase = await createClient()
  const { data: job } = await supabase
    .from('jobs')
    .select(
      'id, name, client_name, address, city, county, status, start_date, end_date, notes, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle<Job>()

  if (!job) notFound()

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Edit job</h1>
          <p>{job.name}</p>
        </div>
        <Link href={`/admin/jobs/${job.id}`} className="adm-btn adm-btn-sm">
          Cancel
        </Link>
      </div>

      <JobForm action={updateJob} job={job} error={error} submitLabel="Save changes" />
    </>
  )
}
