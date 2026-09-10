import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOffice } from '@/lib/admin/auth'
import type { Crew, Job } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'
import JobForm, { type CrewOption } from '../../../_components/JobForm'
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
      'id, name, client_name, address, city, county, status, start_date, end_date, crew_id, notes, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle<Job>()

  if (!job) notFound()

  // Active crews, plus the job's own crew if it has since been retired — otherwise
  // the select would fall back to "No crew yet" and a save would silently clear it.
  const { data: crewRows } = await supabase.from('crews').select('id, name, active').order('name')
  const crews: CrewOption[] = ((crewRows ?? []) as Pick<Crew, 'id' | 'name' | 'active'>[])
    .filter((crew) => crew.active || crew.id === job.crew_id)
    .map(({ id, name }) => ({ id, name }))

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

      <JobForm
        action={updateJob}
        job={job}
        crews={crews}
        error={error}
        submitLabel="Save changes"
      />
    </>
  )
}
