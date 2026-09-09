-- ============================================================================
-- SCONYERS CONCRETE — ADMIN / FIELD APP SCHEMA
-- ----------------------------------------------------------------------------
-- Paste this whole file into the Supabase SQL editor and run it once.
-- It is idempotent: re-running it is safe.
--
-- What it creates
--   * admin_invites  — the allowlist. Nobody can sign in unless their email is here.
--   * profiles       — one row per signed-in user, carrying their role.
--   * jobs           — the thing everything else hangs off.
--   * media_items    — photo/video uploads from the field. Live on upload; the
--                    uploader is the approver. (Dave, Sep 9 2026.)
--   * change_orders  — INTERNAL field-to-office notes. Not a contract document.
--   * crews / crew_events — crew schedule, published as a signed .ics feed.
--   * storage bucket "job-media" (private) + its policies.
--
-- Roles
--   office : Chip, Heather, Brice. Full access, and the only role that deletes.
--   field  : crews. Read jobs, read and upload media, raise change orders.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Allowlist + profiles
-- ---------------------------------------------------------------------------

-- The allowlist. There is NO public signup: a magic link is only ever sent to
-- an email that appears here, and the signup trigger below refuses anyone else.
create table if not exists public.admin_invites (
  email       text primary key,
  role        text not null default 'field' check (role in ('office', 'field')),
  full_name   text,
  created_at  timestamptz not null default now()
);

comment on table public.admin_invites is
  'Allowlist of emails permitted to sign in. Add a row before inviting someone.';

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  full_name   text,
  role        text not null default 'field' check (role in ('office', 'field')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Emails are matched case-insensitively everywhere.
create or replace function public.normalize_email(p_email text)
returns text
language sql
immutable
as $$ select lower(trim(p_email)) $$;

-- Keep admin_invites.email normalised so the lookups below always hit.
create or replace function public.admin_invites_normalize()
returns trigger
language plpgsql
as $$
begin
  new.email := public.normalize_email(new.email);
  return new;
end;
$$;

drop trigger if exists admin_invites_normalize on public.admin_invites;
create trigger admin_invites_normalize
  before insert or update on public.admin_invites
  for each row execute function public.admin_invites_normalize();

-- On signup: refuse anyone not on the allowlist, and copy their role across.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.admin_invites%rowtype;
begin
  select * into v_invite
  from public.admin_invites
  where email = public.normalize_email(new.email);

  if not found then
    raise exception 'not_allowed: % is not on the Sconyers admin allowlist', new.email
      using errcode = '42501';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    public.normalize_email(new.email),
    coalesce(v_invite.full_name, new.raw_user_meta_data ->> 'full_name'),
    v_invite.role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Called by the login page BEFORE asking Supabase for a magic link, so we never
-- email a link to someone who is not on the list. The UI shows the same
-- "check your email" screen either way, so this does not leak membership.
create or replace function public.is_allowed_email(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_invites
    where email = public.normalize_email(p_email)
  );
$$;

revoke all on function public.is_allowed_email(text) from public;
grant execute on function public.is_allowed_email(text) to anon, authenticated;

-- Role helpers. SECURITY DEFINER so RLS policies can call them without
-- recursing into the profiles policies.
create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_office()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'office', false)
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() is not null
$$;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_office() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Jobs
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  client_name text,                       -- the GC or owner Sconyers is pouring for
  address     text,
  city        text,
  county      text,
  status      text not null default 'active'
                check (status in ('bidding', 'upcoming', 'active', 'complete', 'on_hold')),
  start_date  date,
  end_date    date,
  notes       text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_name_idx on public.jobs (lower(name));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at
  before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Media (photos + video from the field)
-- ---------------------------------------------------------------------------
-- There is NO review queue. Anyone who can sign in can upload, and the upload
-- is the approval — the one person adding photos is the same person who would
-- have been approving them. (Dave, Sep 9 2026.) The `status` column below is
-- kept only so old rows still validate; nothing reads it any more.
create table if not exists public.media_items (
  id              uuid primary key default gen_random_uuid(),
  -- Job is required, but it is captured as free text with suggestions, so a
  -- brand-new job name is allowed and job_id stays null until the office links it.
  job_id          uuid references public.jobs (id) on delete set null,
  job_label       text not null,
  captured_on     date not null default current_date,
  media_type      text not null check (media_type in ('photo', 'video')),
  storage_path    text not null unique,
  mime_type       text,
  size_bytes      bigint,
  original_name   text,
  -- Optional, sticky-from-last-upload fields.
  city            text,
  county          text,
  scope           text,
  gc_name         text,
  gc_name_public  boolean not null default false,
  destination     text not null default 'internal'
                    check (destination in ('gallery', 'google', 'both', 'internal')),
  caption         text,
  -- Google Business Profile hand-off. Picking 'google' or 'both' above puts the
  -- row in the queue (see the trigger below). Nothing here writes to Google —
  -- the listing is unverified until the video is recorded at 2290 Strawn Rd, so
  -- the office marks a row posted by hand once it has actually been pushed.
  google_status   text not null default 'not_queued'
                    check (google_status in ('not_queued', 'queued', 'posted', 'skipped')),
  google_posted_at timestamptz,
  google_error    text,
  -- LEGACY. Was the review queue; kept so pre-Sep-9 rows still validate.
  status          text not null default 'approved'
                    check (status in ('pending', 'approved', 'rejected')),
  review_note     text,
  reviewed_by     uuid references public.profiles (id) on delete set null,
  reviewed_at     timestamptz,
  uploaded_by     uuid not null references public.profiles (id) on delete cascade,
  created_at      timestamptz not null default now()
);

create index if not exists media_items_created_idx on public.media_items (created_at desc);
create index if not exists media_items_job_idx on public.media_items (job_id);
create index if not exists media_items_uploader_idx on public.media_items (uploaded_by);
create index if not exists media_items_google_idx
  on public.media_items (google_status, created_at desc);

-- ---------------------------------------------------------------------------
-- 3a. MIGRATION — for the live database, which already has the old shape.
-- ---------------------------------------------------------------------------
-- `create table if not exists` above does nothing on a database that already
-- has this table, so the change from "review queue" to "live on upload" has to
-- be spelled out. All of this is safe to run repeatedly.
alter table public.media_items
  add column if not exists google_status text not null default 'not_queued';
alter table public.media_items
  add column if not exists google_posted_at timestamptz;
alter table public.media_items
  add column if not exists google_error text;

-- The check constraint only when it is genuinely missing — `add constraint`
-- has no IF NOT EXISTS, so guard it.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.media_items'::regclass
      and conname = 'media_items_google_status_check'
  ) then
    alter table public.media_items
      add constraint media_items_google_status_check
      check (google_status in ('not_queued', 'queued', 'posted', 'skipped'));
  end if;
end
$$;

-- The status index went with the queue.
drop index if exists public.media_items_status_idx;

-- Uploads land live from here on.
alter table public.media_items alter column status set default 'approved';

-- One-time catch-up: everything that was sitting in the dead review queue is
-- cleared. Anything an office user actually rejected stays rejected.
update public.media_items set status = 'approved' where status = 'pending';

-- Backfill the Google queue from what the field already asked for.
update public.media_items
   set google_status = 'queued'
 where google_status = 'not_queued'
   and destination in ('google', 'both');

-- Destination decides the queue, on insert, in the database — so it is right
-- however the row got there.
create or replace function public.media_items_queue_for_google()
returns trigger
language plpgsql
as $$
begin
  if new.destination in ('google', 'both') and new.google_status = 'not_queued' then
    new.google_status := 'queued';
  end if;
  return new;
end;
$$;

drop trigger if exists media_items_queue_for_google on public.media_items;
create trigger media_items_queue_for_google
  before insert on public.media_items
  for each row execute function public.media_items_queue_for_google();

-- ---------------------------------------------------------------------------
-- 4. Change orders — INTERNAL ONLY
-- ---------------------------------------------------------------------------
-- This is a field-to-office capture and notification tool. It is NOT the
-- official change order issued to the general contractor, and it carries no
-- signature, approval or audit-trail semantics. The office still issues the
-- real document. (Dave, Sep 9 2026.)
create table if not exists public.change_orders (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references public.jobs (id) on delete set null,
  job_label     text not null,
  description   text not null,
  status        text not null default 'new'
                  check (status in ('new', 'acknowledged', 'handled')),
  office_note   text,
  raised_by     uuid not null references public.profiles (id) on delete cascade,
  raised_by_name text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists change_orders_status_idx on public.change_orders (status, created_at desc);

drop trigger if exists change_orders_touch_updated_at on public.change_orders;
create trigger change_orders_touch_updated_at
  before update on public.change_orders
  for each row execute function public.touch_updated_at();

create table if not exists public.change_order_media (
  id              uuid primary key default gen_random_uuid(),
  change_order_id uuid not null references public.change_orders (id) on delete cascade,
  storage_path    text not null unique,
  mime_type       text,
  size_bytes      bigint,
  original_name   text,
  created_at      timestamptz not null default now()
);

create index if not exists change_order_media_parent_idx
  on public.change_order_media (change_order_id);

-- ---------------------------------------------------------------------------
-- 5. Crews + schedule (published as a signed .ics feed)
-- ---------------------------------------------------------------------------
create table if not exists public.crews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- The .ics feed URL is /api/crew-calendar/<feed_token>.ics — the token IS the
  -- authentication, so treat it like a password and rotate it by updating this
  -- column if a phone is lost.
  feed_token  uuid not null unique default gen_random_uuid(),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.crew_events (
  id          uuid primary key default gen_random_uuid(),
  crew_id     uuid not null references public.crews (id) on delete cascade,
  job_id      uuid references public.jobs (id) on delete set null,
  title       text not null,
  location    text,
  notes       text,
  starts_on   date not null,
  ends_on     date,
  start_time  time,
  end_time    time,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists crew_events_crew_idx on public.crew_events (crew_id, starts_on);

drop trigger if exists crew_events_touch_updated_at on public.crew_events;
create trigger crew_events_touch_updated_at
  before update on public.crew_events
  for each row execute function public.touch_updated_at();

-- The .ics endpoint is hit by Google/Apple/Outlook with no session, so it reads
-- through this SECURITY DEFINER function and the token alone. Nothing else is
-- exposed to anon.
create or replace function public.crew_calendar_feed(p_token uuid)
returns table (
  crew_name   text,
  event_id    uuid,
  title       text,
  location    text,
  notes       text,
  starts_on   date,
  ends_on     date,
  start_time  time,
  end_time    time,
  updated_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.name, e.id, e.title, e.location, e.notes,
         e.starts_on, e.ends_on, e.start_time, e.end_time, e.updated_at
  from public.crews c
  join public.crew_events e on e.crew_id = c.id
  where c.feed_token = p_token
    and c.active
    and e.starts_on >= (current_date - interval '90 days')
  order by e.starts_on, e.start_time nulls first;
$$;

revoke all on function public.crew_calendar_feed(uuid) from public;
grant execute on function public.crew_calendar_feed(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Row level security
-- ---------------------------------------------------------------------------
alter table public.admin_invites     enable row level security;
alter table public.profiles          enable row level security;
alter table public.jobs              enable row level security;
alter table public.media_items       enable row level security;
alter table public.change_orders     enable row level security;
alter table public.change_order_media enable row level security;
alter table public.crews             enable row level security;
alter table public.crew_events       enable row level security;

-- admin_invites: office only. (Everyone else goes through is_allowed_email().)
drop policy if exists admin_invites_office_all on public.admin_invites;
create policy admin_invites_office_all on public.admin_invites
  for all to authenticated using (public.is_office()) with check (public.is_office());

-- profiles: read your own; office reads everyone. Nobody self-promotes.
drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_office());

drop policy if exists profiles_office_write on public.profiles;
create policy profiles_office_write on public.profiles
  for update to authenticated using (public.is_office()) with check (public.is_office());

-- jobs: every active staff member reads; only the office writes.
drop policy if exists jobs_staff_read on public.jobs;
create policy jobs_staff_read on public.jobs
  for select to authenticated using (public.is_staff());

drop policy if exists jobs_office_write on public.jobs;
create policy jobs_office_write on public.jobs
  for all to authenticated using (public.is_office()) with check (public.is_office());

-- media: one shared crew of trusted people — everyone signed in sees every
-- photo. The office/field split on *viewing* stopped earning its keep the
-- moment the review queue went away (Dave, Sep 9 2026). Deleting is still
-- office-only, and so is editing a caption or the Google queue state.
drop policy if exists media_read on public.media_items;
create policy media_read on public.media_items
  for select to authenticated
  using (public.is_staff());

drop policy if exists media_insert on public.media_items;
create policy media_insert on public.media_items
  for insert to authenticated
  with check (public.is_staff() and uploaded_by = auth.uid());

drop policy if exists media_office_update on public.media_items;
create policy media_office_update on public.media_items
  for update to authenticated using (public.is_office()) with check (public.is_office());

drop policy if exists media_office_delete on public.media_items;
create policy media_office_delete on public.media_items
  for delete to authenticated using (public.is_office());

-- change orders: anyone raises one, the office works them.
drop policy if exists change_orders_read on public.change_orders;
create policy change_orders_read on public.change_orders
  for select to authenticated
  using (public.is_office() or raised_by = auth.uid());

drop policy if exists change_orders_insert on public.change_orders;
create policy change_orders_insert on public.change_orders
  for insert to authenticated
  with check (public.is_staff() and raised_by = auth.uid());

drop policy if exists change_orders_office_update on public.change_orders;
create policy change_orders_office_update on public.change_orders
  for update to authenticated using (public.is_office()) with check (public.is_office());

drop policy if exists change_order_media_read on public.change_order_media;
create policy change_order_media_read on public.change_order_media
  for select to authenticated
  using (
    exists (
      select 1 from public.change_orders co
      where co.id = change_order_id
        and (public.is_office() or co.raised_by = auth.uid())
    )
  );

drop policy if exists change_order_media_insert on public.change_order_media;
create policy change_order_media_insert on public.change_order_media
  for insert to authenticated
  with check (
    exists (
      select 1 from public.change_orders co
      where co.id = change_order_id and co.raised_by = auth.uid()
    )
  );

-- crews + schedule: staff read, office writes.
drop policy if exists crews_staff_read on public.crews;
create policy crews_staff_read on public.crews
  for select to authenticated using (public.is_staff());

drop policy if exists crews_office_write on public.crews;
create policy crews_office_write on public.crews
  for all to authenticated using (public.is_office()) with check (public.is_office());

drop policy if exists crew_events_staff_read on public.crew_events;
create policy crew_events_staff_read on public.crew_events
  for select to authenticated using (public.is_staff());

drop policy if exists crew_events_office_write on public.crew_events;
create policy crew_events_office_write on public.crew_events
  for all to authenticated using (public.is_office()) with check (public.is_office());

-- ---------------------------------------------------------------------------
-- 7. Storage
-- ---------------------------------------------------------------------------
-- Private bucket. The browser uploads straight to it with the user's own
-- session, which keeps large jobsite video off the Vercel function (4.5 MB body
-- limit) entirely. Viewing goes through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('job-media', 'job-media', false)
on conflict (id) do nothing;

drop policy if exists job_media_insert on storage.objects;
create policy job_media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'job-media' and public.is_staff() and owner = auth.uid());

-- Matches media_read: any signed-in staff member can view any jobsite file.
-- Without this the media library would list rows whose previews 403.
drop policy if exists job_media_read on storage.objects;
create policy job_media_read on storage.objects
  for select to authenticated
  using (bucket_id = 'job-media' and public.is_staff());

drop policy if exists job_media_office_delete on storage.objects;
create policy job_media_office_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'job-media' and public.is_office());

-- ---------------------------------------------------------------------------
-- 8. Seed
-- ---------------------------------------------------------------------------
-- Everyone who should be able to sign in needs a row here first. These four
-- are the real addresses, confirmed by Dave on Sep 9 2026 — add anyone else
-- here or from the admin. Re-running is safe.
insert into public.admin_invites (email, role, full_name) values
  ('chip.sconyers@sconyersconcrete.com', 'office', 'Chip Sconyers'),
  ('heather.gray@sconyersconcrete.com',  'office', 'Heather Gray'),
  ('brice.wiley@sconyersconcrete.com',   'office', 'Brice Wiley'),
  ('dave@creativecowboys.co',            'office', 'Dave Collum')
on conflict (email) do update
  set role = excluded.role,
      full_name = coalesce(excluded.full_name, public.admin_invites.full_name);

-- One crew to start. Add the rest from the admin, or here.
insert into public.crews (name)
select 'Crew 1'
where not exists (select 1 from public.crews);
