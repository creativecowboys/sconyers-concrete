/** Shapes mirrored from supabase/schema.sql. Kept hand-written and small. */

export type Role = 'office' | 'field'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: Role
  active: boolean
}

export const JOB_STATUSES = [
  'bidding',
  'upcoming',
  'active',
  'on_hold',
  'complete',
] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  bidding: 'Bidding',
  upcoming: 'Upcoming',
  active: 'Active',
  on_hold: 'On hold',
  complete: 'Complete',
}

/**
 * How a job is billed. Chip, Sep 15 2026:
 *   day_rate      — a set day rate, labor only. Bid as crew-days.
 *   eighty_twenty — Sconyers wins the contract, hands 80% to a crew who buy
 *                   the forms and bring the equipment, keeps 20% for oversight
 *                   and billing. Progress is billed off a Schedule of Values.
 */
export const JOB_TYPES = ['day_rate', 'eighty_twenty'] as const
export type JobType = (typeof JOB_TYPES)[number]

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  day_rate: 'Day rate',
  eighty_twenty: '80/20',
}

export type Job = {
  id: string
  name: string
  client_name: string | null
  address: string | null
  city: string | null
  county: string | null
  status: JobStatus
  start_date: string | null
  end_date: string | null
  /** The crew assigned on the job screen. null until the office picks one. */
  crew_id: string | null
  notes: string | null
  job_type: JobType
  /** Day rate only: labor-only rate per crew-day, in cents. */
  day_rate_cents: number | null
  /** Day rate only: the crew-days the job was bid at. */
  days_bid: number | null
  /** 80/20 only: the contract Sconyers won, in cents. */
  contract_cents: number | null
  /** 80/20 only: the crew's share of the contract. Defaults to 80. */
  crew_share_pct: number
  created_at: string
  updated_at: string
}

/** Every column a page needs to build a `Job`. One place, so a new column is added once. */
export const JOB_COLUMNS =
  'id, name, client_name, address, city, county, status, start_date, end_date, crew_id, notes, job_type, day_rate_cents, days_bid, contract_cents, crew_share_pct, created_at, updated_at'

/**
 * One line of a Schedule of Values, laid out like the AIA G703 sheet. Total
 * completed, % complete and balance to finish are derived in lib/admin/sov.ts,
 * never stored.
 */
export type SovLine = {
  id: string
  job_id: string
  sort: number
  item_no: string | null
  description: string
  scheduled_value_cents: number
  previous_completed_cents: number
  this_period_cents: number
  stored_cents: number
  retainage_pct: number
}

export const MEDIA_DESTINATIONS = ['gallery', 'google', 'both', 'internal'] as const
export type MediaDestination = (typeof MEDIA_DESTINATIONS)[number]

export const MEDIA_DESTINATION_LABELS: Record<MediaDestination, string> = {
  gallery: 'Website gallery',
  google: 'Google listing',
  both: 'Both',
  internal: 'Internal only',
}

/**
 * LEGACY. `media_items.status` was the review queue, which Dave killed on
 * Sep 9 2026 — whoever uploads a photo is the person who would have approved
 * it. New rows land 'approved'; nothing in the UI reads this any more.
 */
export type MediaStatus = 'pending' | 'approved' | 'rejected'

export const GOOGLE_STATUSES = ['not_queued', 'queued', 'posted', 'skipped'] as const
export type GoogleStatus = (typeof GOOGLE_STATUSES)[number]

export const GOOGLE_STATUS_LABELS: Record<GoogleStatus, string> = {
  not_queued: 'Not for Google',
  queued: 'Waiting to post',
  posted: 'Posted to Google',
  skipped: 'Skipped',
}

export type MediaItem = {
  id: string
  job_id: string | null
  job_label: string
  captured_on: string
  media_type: 'photo' | 'video'
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  original_name: string | null
  city: string | null
  county: string | null
  scope: string | null
  gc_name: string | null
  gc_name_public: boolean
  destination: MediaDestination
  caption: string | null
  google_status: GoogleStatus
  google_posted_at: string | null
  google_error: string | null
  status: MediaStatus
  review_note: string | null
  reviewed_at: string | null
  uploaded_by: string
  created_at: string
}

/**
 * A file in the shared Docs folder. Named DocumentRow rather than Document so
 * it never shadows the DOM's global `Document` type inside a .tsx file.
 */
export type DocumentRow = {
  id: string
  title: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  original_name: string | null
  uploaded_by: string | null
  uploaded_by_name: string | null
  created_at: string
}

export const CHANGE_ORDER_STATUSES = ['new', 'acknowledged', 'handled'] as const
export type ChangeOrderStatus = (typeof CHANGE_ORDER_STATUSES)[number]

export const CHANGE_ORDER_STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  new: 'New',
  acknowledged: 'Seen by office',
  handled: 'Handled',
}

export type ChangeOrder = {
  id: string
  job_id: string | null
  job_label: string
  description: string
  status: ChangeOrderStatus
  office_note: string | null
  raised_by: string
  raised_by_name: string | null
  created_at: string
  updated_at: string
}

export type Crew = {
  id: string
  name: string
  feed_token: string
  active: boolean
}

export type CrewEvent = {
  id: string
  crew_id: string
  job_id: string | null
  title: string
  location: string | null
  notes: string | null
  starts_on: string
  ends_on: string | null
  start_time: string | null
  end_time: string | null
}

/**
 * Google Business Profile video limits. Surfaced in the upload UI so a
 * two-minute walkthrough is not a surprise rejection later.
 */
export const GBP_VIDEO_LIMITS = {
  seconds: 30,
  megabytes: 100,
  resolution: '720p',
} as const
