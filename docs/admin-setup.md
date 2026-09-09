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

Section 3a of the file is the migration for a database that already has the old
media shape (a review queue and a `pending` default). It is plain `alter table
… if not exists` plus two one-time `update`s, all safe to run again.

The script also creates the two private storage buckets — `job-media` for
jobsite photos and video, `docs` for the shared Docs folder (section 3b) — and
every row level security policy.

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

- **office** — Chip, Heather, Brice. Everything: create and edit jobs, delete
  media, work the Google queue and captions, work change orders, manage crews
  and the schedule.
- **field** — crews. Read the job list and job detail, upload media, see the
  whole photo library, fix the labels on any photo (job, date taken, caption,
  destination), raise a change order. They cannot delete anything.

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

**There is no review queue.** Anyone who can sign in can upload, and the upload
is the approval — the one person adding jobsite photos is the same person who
would have been approving them (Dave, Sep 9 2026). Everything lands live in the
photo library at `/admin/media`, newest first, filterable by job, with
short-lived signed preview URLs off the private bucket. Every signed-in staff
member sees the whole library and can **edit the labels on any photo** — job,
date taken, caption, and where it is meant to go — from the "Edit details"
button on each card (Dave, Sep 9 2026: "anyone is fine"). Changing the
destination to Google or Both queues the photo for the listing; changing it
away takes a still-waiting photo back out; an already-posted photo is left
alone. That is a database trigger, not the UI, so it holds however the row is
edited. **Deleting is office-only**, in the UI and in row level security both,
and it removes the file from storage as well as the row.

The legacy `media_items.status` column is left in place so pre-Sep-9 rows still
validate. Nothing reads it.

### One upload, two destinations

Picking **Google listing** or **Both** on the upload form puts the row in the
Google queue — a `before insert` trigger sets `google_status = 'queued'` from
`destination`, so the queue is right however the row got there. The office works
that queue at `/admin/google`: preview, job, detail, and a caption field to
write the post copy in advance.

**Nothing in this app writes to Google.** The Business Profile went back to
unverified when the address moved to 2290 Strawn Rd, and Google refuses every
listing change — photos included — until Heather or Chip records the
verification video there. The push button is deliberately disabled and says so.
"Mark as posted" is a bookkeeping action for after Creative Cowboys has pushed
the photo through Search Atlas; it posts nothing.

When the listing clears, the push that works is: file → public URL →
`gbp_upsert_media_library_item` → `gbp_manage_media(action:"add", image_urls:
[…])` → `gbp_bulk_deploy_locations`. That runs through Creative Cowboys' Search
Atlas connection, not the client's.

**The website half does not exist yet.** There is no public gallery route on
this site, so "gallery" and "both" record the intent and nothing more. Building
`/our-work` is the remaining half of "one step, two places."

Google Business Profile video limits, surfaced in the upload form and again on
the queue: 30 seconds, 100 MB, 720p or better.

## Storage cost

Video is the sleeper. Crews upload weekly and nothing is ever deleted, so the
storage bill only goes up. Worth a look at the Supabase usage page every few
months.
