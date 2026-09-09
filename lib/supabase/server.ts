import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

/**
 * Server-side Supabase client bound to the request cookies.
 *
 * Every admin query runs through this, as the signed-in user, so Postgres RLS
 * is what actually enforces "office can do X, field can only do Y". There is no
 * service-role key anywhere in this project on purpose — the two things that
 * need to read without a session (the allowlist check and the .ics feed) go
 * through SECURITY DEFINER functions instead.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // proxy refreshes the session, so this is safe to swallow.
        }
      },
    },
  })
}
