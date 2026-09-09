import { isSupabaseConfigured } from '@/lib/supabase/env'
import SubmitButton from '../_components/SubmitButton'
import { requestMagicLink } from './actions'

type Search = Record<string, string | string[] | undefined>

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

const ERRORS: Record<string, string> = {
  email: 'That does not look like an email address. Try again.',
  unconfigured:
    'The admin is not connected to its database yet, so sign-in is switched off.',
  server: 'Something went wrong on our end. Try again in a minute.',
  expired: 'That link has expired or was already used. Ask for a fresh one.',
  denied: 'That link could not be verified. Ask for a fresh one.',
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const params = await searchParams
  const sent = one(params.sent)
  const next = one(params.next) ?? '/admin'
  const error = one(params.error)
  const configured = isSupabaseConfigured()

  return (
    <div className="adm-login-wrap">
      <div className="adm-login">
        <h1>Sconyers staff sign-in</h1>
        <p className="adm-login-sub">
          Office and field crew only. No password — we email you a link.
        </p>

        {!configured ? (
          <div className="adm-note adm-note-warn">
            <strong>Not connected yet.</strong> This admin is waiting on its
            Supabase project. Once the environment variables are set in Vercel,
            sign-in switches on with no code change.
          </div>
        ) : sent ? (
          <>
            <div className="adm-note adm-note-ok">
              <strong>Check your email.</strong> If <strong>{sent}</strong> is on
              the staff list, a sign-in link is on its way. It is good for one
              hour.
            </div>
            <div className="adm-note adm-mt">
              <strong>Open the link on this phone.</strong> The link only works
              in the browser that asked for it — forwarding it to another device
              will not sign you in.
            </div>
            <a className="adm-btn adm-btn-block adm-mt" href="/admin/login">
              Use a different email
            </a>
          </>
        ) : (
          <form action={requestMagicLink}>
            {error ? (
              <div className="adm-note adm-note-bad adm-mb">
                {ERRORS[error] ?? ERRORS.server}
              </div>
            ) : null}

            <input type="hidden" name="next" value={next} />

            <label className="adm-field">
              <span className="adm-field-label">Work email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                required
                placeholder="you@sconyersconcrete.com"
              />
            </label>

            <SubmitButton
              className="adm-btn adm-btn-primary adm-btn-block"
              pendingLabel="Sending…"
            >
              Email me a sign-in link
            </SubmitButton>
          </form>
        )}

        <p className="adm-small adm-muted adm-mt-lg">
          Can&rsquo;t get in? The office has to add your email to the staff list
          before a link will send.
        </p>
      </div>
    </div>
  )
}
