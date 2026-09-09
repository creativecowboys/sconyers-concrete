/**
 * Supabase configuration, read once and shared.
 *
 * The admin is built ahead of the Supabase project existing, so nothing here
 * throws at import time — `isSupabaseConfigured` lets the admin render an
 * honest "not connected yet" screen instead of a 500 on a preview deploy.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

/** Bucket created by supabase/schema.sql. Private. */
export const MEDIA_BUCKET = 'job-media'
