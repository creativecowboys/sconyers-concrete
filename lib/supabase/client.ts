'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/**
 * Browser client. Used for one thing that genuinely has to happen in the
 * browser: uploading straight to Supabase Storage. Routing a 90 MB jobsite
 * video through a Vercel function would hit the 4.5 MB request-body limit, so
 * the file never touches our server.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
