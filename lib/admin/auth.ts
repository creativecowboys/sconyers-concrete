import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { Profile } from './types'

/**
 * The signed-in user's profile, or null.
 *
 * `getUser()` rather than `getSession()` on purpose: getUser revalidates the
 * token against Supabase, so a forged cookie cannot walk in.
 */
export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, active')
    .eq('id', user.id)
    .maybeSingle()

  if (!data || !data.active) return null
  return data as Profile
}

/** Guard for every admin page. Sends anyone without a profile to the login. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/admin/login')
  return profile
}

/** Guard for office-only pages and actions. */
export async function requireOffice(): Promise<Profile> {
  const profile = await requireProfile()
  if (profile.role !== 'office') redirect('/admin?denied=office')
  return profile
}

export function displayName(profile: Profile) {
  return profile.full_name?.trim() || profile.email
}
