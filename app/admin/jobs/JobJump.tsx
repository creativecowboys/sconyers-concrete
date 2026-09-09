'use client'

import { useRouter } from 'next/navigation'

/**
 * Job picker for the jobs page. Sconyers runs a handful of jobs at a time
 * (Dave, Sep 9 2026), so a dropdown beats a search box: no typing, and it
 * takes one tap on a phone instead of type-then-submit.
 *
 * Navigating on change rather than behind a Go button is deliberate — this is
 * used on a jobsite, one-handed, often with gloves on.
 */
export function JobJump({ jobs }: { jobs: { id: string; name: string }[] }) {
  const router = useRouter()

  if (jobs.length === 0) return null

  return (
    <label className="adm-field" style={{ marginBottom: 0 }}>
      <span className="adm-field-label">Go to a job</span>
      <select
        defaultValue=""
        onChange={(event) => {
          const id = event.target.value
          if (id) router.push(`/admin/jobs/${id}`)
        }}
      >
        <option value="">Choose a job…</option>
        {jobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.name}
          </option>
        ))}
      </select>
    </label>
  )
}
