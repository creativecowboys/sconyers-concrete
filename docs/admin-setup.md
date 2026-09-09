# Staff admin — setup

The `/admin` section of this site is a job-management tool for Sconyers office
staff and field crews. It ships in this repo but does nothing until a Supabase
project exists behind it. Until then `/admin/login` renders an honest "not
connected yet" screen instead of erroring, so it is safe to merge and deploy
ahead of provisioning.

Nothing in `/admin` is indexed: `noindex` metadata on the admin layout,
`Disallow: /admin` in `robots.txt`, an `X-Robots-Tag: noindex` header from
`proxy.ts`, and no admin route in the sitemap.

---

## 1. Create the Supabase project

<https://supabase.com> → New project. Region `us-east-1` (closest to Georgia).
Save the database password in the password manager, not here.

## 2. Run the schema

Supabase dashboard → SQL Editor → paste the whole of `supabase/schema.sql` →
Run. It is idempotent, so running it again later is safe.

The seed block at the bottom is the allowlist — Chip, Heather, Brice and Dave,
all confirmed addresses. Nobody can sign in unless their address is in
`admin_invites`, so anyone added later needs a row (see section 6).

The script also creates the private `job-media` storage bucket and every row
level security policy.

## 3. Set the environment variables

Vercel → project `sconyers-concrete` → Settings → Environment Variables. Add to
**Production, Preview and Development**:

| Variable | Where the value comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon / public key |
| `CHANGE_ORDER_TO_EMAILS` | Comma-separated list of who gets the change-order email |

`RESEND_API_KEY` and `CONTACT_FROM_EMAIL` are already set for the contact form
and are reused as-is.

The anon key is meant to be public — row level security is what protects the
data. There is deliberately **no service-role key** in this project.

Copy the same two `NEXT_PUBLIC_*` values into `.env.local` for local work.

## 4. Point Supabase at the site

Supabase → Authentication → URL Configuration:

- **Site URL:** `https://www.sconyersconcrete.com`
- **Redirect URLs:** add both
  - `https://www.sconyersconcrete.com/admin/auth/callback`
  - `https://*-creative-cowboys-a239e416.vercel.app/admin/auth/callback` (so
    sign-in works on preview deploys)
  - `http://localhost:3712/admin/auth/callback` (local)

Without these the magic link bounces.

## 5. Email deliverability (do this before the crews see it)

Supabase's built-in mailer is rate limited to a handful of messages an hour and
is fine for testing only. Before real use, point Supabase at Resend:
Authentication → Emails → SMTP Settings, using the Resend SMTP credentials and
a From address on the verified `send.sconyersconcrete.com` subdomain.

## 6. Adding people later

1. Supabase → Table Editor → `admin_invites` → Insert row: email, and role
   `office` or `field`.
2. Tell them to go to `/admin/login` and ask for a link.

There is no signup form. An address that is not on the allowlist never receives
a link, and the database refuses the account outright.

**The link has to be opened on the same phone or browser that asked for it.**
Forwarding it to another device will not sign anyone in.

---

## Roles

- **office** — Chip, Heather, Brice. Everything: create and edit jobs, approve
  or reject media, work change orders, manage crews and the schedule.
- **field** — crews. Read the job list and job detail, upload media, raise a
  change order, and see their own submissions. They cannot see anyone else's
  uploads.

Roles are enforced in Postgres by row level security, not just in the UI.

## Crew calendars

Each crew has a subscription URL at `/api/crew-calendar/<token>.ics`. The token
is the authentication, so treat the link like a password. If a phone goes
missing, use "Issue a new link" on the crews page — the old URL stops working
straight away and everyone on that crew re-subscribes.

## Change orders

Internal only. This captures what the field saw and emails the office; it is
**not** the change order issued to the general contractor, and the UI says so.
No signatures, no GC approval, no audit trail. The office still issues the real
document.

## Media

Nothing is public on upload. Everything lands in an office review queue with
short-lived signed preview URLs. Approving marks a photo cleared for use — it
does not push it anywhere. Publishing to the website gallery and to the Google
Business Profile is still a separate, manual step, and Google writes are blocked
entirely until the Business Profile verification video is recorded at 2290
Strawn Rd.

Google Business Profile video limits, surfaced in the upload form: 30 seconds,
100 MB, 720p or better.

## Storage cost

Video is the sleeper. Crews upload weekly and nothing is ever deleted, so the
storage bill only goes up. Worth a look at the Supabase usage page every few
months.
