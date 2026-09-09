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
  notes: string | null
  created_at: string
  updated_at: string
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
