import Link from 'next/link'
import { displayName, requireProfile } from '@/lib/admin/auth'
import { signDocumentUrls } from '@/lib/admin/docs-server'
import { todayInGeorgia } from '@/lib/admin/format'
import { assessJobs, type JobRow, type ScheduleRow } from '@/lib/admin/job-health'
import type { DocumentRow } from '@/lib/admin/types'
import { createClient } from '@/lib/supabase/server'
import DocsCard from './_components/DocsCard'
import JobHealthPanel from './_components/JobHealthPanel'

type Search = Record<string, string | string[] | undefined>

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const profile = await requireProfile()
  const params = await searchParams
  const denied = params.denied

  const supabase = await createClient()
  const office = profile.role === 'office'

  // Job health, version one: crew days on site vs working days planned.
  // "Today" is Georgia's today — a 9pm upload must not roll into tomorrow.
  const today = todayInGeorgia()
  const { data: activeRows } = await supabase
    .from('jobs')
    .select('id, name, status, start_date, end_date')
    .eq('status', 'active')
    .order('name')
    .limit(200)
  const activeList = (activeRows ?? []) as JobRow[]
  const activeIds = activeList.map((job) => job.id)

  // The Docs card shows the newest five; `count` is the whole folder, so the
  // card knows whether to offer "See all".
  const [schedule, docsResult] = await Promise.all([
    activeIds.length
      ? supabase
          .from('crew_events')
          .select('job_id, starts_on, ends_on')
          .in('job_id', activeIds)
          .lte('starts_on', today)
          .limit(2000)
      : Promise.resolve({ data: [] as ScheduleRow[] }),
    supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const health = assessJobs(activeList, (schedule.data ?? []) as ScheduleRow[], today)
  const docs = (docsResult.data ?? []) as DocumentRow[]
  const docsTotal = docsResult.count ?? docs.length
  const docUrls = await signDocumentUrls(supabase, docs)

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Howdy, {displayName(profile).split(' ')[0]}</h1>
          <p>
            {office
              ? 'Office view — you can create jobs, review photos and run the crew schedule.'
              : 'Field view — pull up a job and send in photos.'}
          </p>
        </div>
      </div>

      {denied ? (
        <div className="adm-note adm-note-warn adm-mb">
          <strong>Office only.</strong> That page is limited to office staff. If
          you need it, ask Heather to change your access.
        </div>
      ) : null}

      <JobHealthPanel jobs={health} />

      <div className="adm-stack adm-mt-lg">
        <Link href="/admin/upload" className="adm-btn adm-btn-primary adm-btn-block">
          Upload jobsite photos or video
        </Link>
        <Link href="/admin/jobs" className="adm-btn adm-btn-block">
          Look up a job
        </Link>
        <Link href="/admin/media" className="adm-btn adm-btn-block">
          See the photo library
        </Link>
      </div>

      <DocsCard docs={docs} total={docsTotal} signed={docUrls} />

      {office ? (
        <div className="adm-stack adm-mt-lg">
          <Link href="/admin/jobs/new" className="adm-btn adm-btn-block">
            Add a new job
          </Link>
          <Link href="/admin/crews" className="adm-btn adm-btn-block">
            Crew schedule &amp; calendar links
          </Link>
        </div>
      ) : null}

      <div className="adm-note adm-mt-lg">
        <strong>Photos are on file the moment you send them.</strong> There is
        no review queue — whoever takes the picture is the one who decides it is
        worth keeping. Marking one for the Google listing puts it in a queue the
        office works; the listing itself is still waiting on the verification
        video at 2290 Strawn Rd.
      </div>
    </>
  )
}
