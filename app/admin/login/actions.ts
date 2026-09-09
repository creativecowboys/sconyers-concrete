'use server'

import { redirect } from 'next/navigation'
import { getOrigin } from '@/lib/admin/origin'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

/** Only these are honoured as a post-login destination — no open redirects. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'
}

export async function requestMagicLink(formData: FormData) {
  const email =
    typeof formData.get('email') === 'string'
      ? (formData.get('email') as string).trim().toLowerCase()
      : ''
  const next = safeNext(formData.get('next'))

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect('/admin/login?error=email')
  }

  if (!isSupabaseConfigured()) {
    redirect('/admin/login?error=unconfigured')
  }

  const supabase = await createClient()

  // Allowlist check first, so a link is never emailed to someone who is not on
  // it. The page shows the same "check your email" screen either way, so this
  // does not tell a stranger whether an address is on the list.
  const { data: allowed, error: rpcError } = await supabase.rpc('is_allowed_email', {
    p_email: email,
  })

  if (rpcError) {
    console.error('[admin/login] allowlist check failed:', rpcError.message)
    redirect('/admin/login?error=server')
  }

  if (allowed === true) {
    const origin = await getOrigin()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // The signup trigger in schema.sql refuses anyone off the allowlist, so
        // an allowlisted person can sign in the first time without anybody
        // creating an account for them.
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/admin/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) console.error('[admin/login] signInWithOtp failed:', error.message)
  }

  redirect(`/admin/login?sent=${encodeURIComponent(email)}`)
}
