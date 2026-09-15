import Link from 'next/link'
import { displayName, requireProfile } from '@/lib/admin/auth'
import { signDocumentUrls } from '@/lib/admin/docs-server'
import { todayInGeorgia } from '@/lib/admin/format'
import { assessJobs, type JobRow, type ScheduleRow } from '@/lib/admin/job-health'
import { summarize, type SovInput, type SovSummary } from '@/lib/admin/sov'
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

  // Job health: day-rate jobs measure crew days on site vs working days
  // planned; 80/20 jobs measure SOV % complete vs the schedule.
  // "Today" is Georgia's today — a 9pm upload must not roll into tomorrow.
  const today = todayInGeorgia()
  const { data: activeRows } = await supabase
    .from('jobs')
    .select(
      'id, name, status, start_date, end_date, job_type, day_rate_cents, days_bid, contract_cents, crew_share_pct'
    )
    .eq('status', 'active')
    .order('name')
    .limit(200)
  const activeList = (activeRows ?? []) as JobRow[]
  const activeIds = activeList.map((job) => job.id)
  const sovJobIds = activeList
    .filter((job) => job.job_type === 'eighty_twenty')
    .map((job) => job.id)

  // The Docs card shows the newest five; `count` is the whole folder, so the
  // card knows whether to offer "See all".
  const [schedule, sovResult, docsResult] = await Promise.all([
    activeIds.length
      ? supabase
          .from('crew_events')
          .select('job_id, starts_on, ends_on, crews(name)')
          .in('job_id', activeIds)
          .lte('starts_on', today)
          .limit(2000)
      : Promise.resolve({ data: [] as ScheduleRow[] }),
    sovJobIds.length
      ? supabase
          .from('sov_lines')
          .select(
            'job_id, scheduled_value_cents, previous_completed_cents, this_period_cents, stored_cents, retainage_pct'
          )
          .in('job_id', sovJobIds)
          .limit(5000)
      : Promise.resolve({ data: [] as (SovInput & { job_id: string })[] }),
    supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const scheduleRows = (schedule.data ?? []) as unknown as ScheduleRow[]

  // SOV lines rolled up per 80/20 job. A job with no lines is left out of the
  // map on purpose — the widget says "No SOV yet" for it.
  const sovLinesByJob = new Map<string, SovInput[]>()
  for (const row of (sovResult.data ?? []) as (SovInput & { job_id: string })[]) {
    const list = sovLinesByJob.get(row.job_id) ?? []
    list.push(row)
    sovLinesByJob.set(row.job_id, list)
  }
  const sovByJob = new Map<string, SovSummary>()
  for (const [jobId, lines] of sovLinesByJob) sovByJob.set(jobId, summarize(lines))

  // Which crews have been on each job. Dave, Sep 9: the widget should say who is
  // on what, and the date the crew is expected to be done.
  const crewsByJob = new Map<string, Set<string>>()
  for (const row of scheduleRows) {
    const crewName = row.crews?.name
    if (!row.job_id || !crewName) continue
    let names = crewsByJob.get(row.job_id)
    if (!names) {
      names = new Set()
      crewsByJob.set(row.job_id, names)
    }
    names.add(crewName)
  }
  const endDateById = new Map(activeList.map((job) => [job.id, job.end_date]))

  const health = assessJobs(activeList, scheduleRows, today, sovByJob).map((job) => {
    const end = endDateById.get(job.id) ?? null
    return {
      ...job,
      crews: [...(crewsByJob.get(job.id) ?? [])].sort(),
      due: end ? { date: end, past: end < today } : null,
    }
  })

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
