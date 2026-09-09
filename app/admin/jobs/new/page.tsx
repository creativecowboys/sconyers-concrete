import Link from 'next/link'
import { requireOffice } from '@/lib/admin/auth'
import JobForm from '../../_components/JobForm'
import { createJob } from '../actions'

type Search = Record<string, string | string[] | undefined>

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  await requireOffice()
  const params = await searchParams
  const error = Array.isArray(params.error) ? params.error[0] : params.error

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>New job</h1>
          <p>Only the name is required. The rest can be filled in later.</p>
        </div>
        <Link href="/admin/jobs" className="adm-btn adm-btn-sm">
          Cancel
        </Link>
      </div>

      <JobForm action={createJob} error={error} submitLabel="Create job" />
    </>
  )
}
