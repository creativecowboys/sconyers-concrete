-- ============================================================================
-- TEST DATA — the `TEST —` jobs Chip sees on the admin home (Sep 9 + Sep 15 2026)
-- ----------------------------------------------------------------------------
-- Run in the Supabase SQL editor after section 3d of schema.sql. Re-runnable.
-- Everything is keyed on the `TEST — ` name prefix so the sweep at the bottom
-- still clears it all before real use.
--
-- Sep 9 seeded six jobs + ~27 crew_events + three crews. This file:
--   * turns "TEST — Morton warehouse slab" into an 80/20 job with a $145,000
--     contract and a six-line SOV about 43% billed (Behind — it is past its
--     end date, which is the state it was already in on the days bar)
--   * gives "TEST — Fire station footings" a day rate of $2,400 and 11 days
--     bid, so the widget shows the money line under its days bar
--   * gives "TEST — Retail pad parking lot" a day rate too (3 of 11 days,
--     On track, so the $ line reads early-in-the-job)
--   * turns "TEST — Truck court phase 2" (upcoming) into 80/20 with no SOV
--     lines, so the "No SOV yet" state is visible once it goes active
-- ============================================================================

-- 1. Day-rate jobs: rate + days bid ------------------------------------------
update public.jobs
   set job_type = 'day_rate', day_rate_cents = 240000, days_bid = 11,
       contract_cents = null, crew_share_pct = 80
 where name like 'TEST — Fire station%';

update public.jobs
   set job_type = 'day_rate', day_rate_cents = 220000, days_bid = 11,
       contract_cents = null, crew_share_pct = 80
 where name like 'TEST — Retail pad%';

-- 2. 80/20 jobs: contract + split ---------------------------------------------
update public.jobs
   set job_type = 'eighty_twenty', contract_cents = 14500000, crew_share_pct = 80,
       day_rate_cents = null, days_bid = null
 where name like 'TEST — Morton%';

update public.jobs
   set job_type = 'eighty_twenty', contract_cents = 9800000, crew_share_pct = 80,
       day_rate_cents = null, days_bid = null
 where name like 'TEST — Truck court%';

-- 3. Morton's Schedule of Values (G703 layout) ---------------------------------
-- Replace, so re-running does not stack lines.
delete from public.sov_lines
 where job_id in (select id from public.jobs where name like 'TEST — Morton%');

insert into public.sov_lines
  (job_id, sort, item_no, description, scheduled_value_cents,
   previous_completed_cents, this_period_cents, stored_cents, retainage_pct)
select j.id, l.sort, l.item_no, l.description, l.scheduled, l.previous, l.this_period, l.stored, l.retainage
  from public.jobs j
  cross join (values
    (0, '1', 'Mobilization & layout',              600000,  600000,      0,      0, 10),
    (1, '2', 'Excavation & sub-grade prep',      1850000, 1850000,      0,      0, 10),
    (2, '3', 'Forms, rebar & vapor barrier',     2900000, 1450000, 725000, 300000, 10),
    (3, '4', 'Slab pour — 6" 4000 psi',           5400000,       0,      0,      0, 10),
    (4, '5', 'Finish, cure & saw-cut joints',    2450000,       0,      0,      0, 10),
    (5, '6', 'Demobilization & clean-up',         1300000,       0,      0,      0, 10)
  ) as l (sort, item_no, description, scheduled, previous, this_period, stored, retainage)
 where j.name like 'TEST — Morton%';

-- Check: Morton should read 6 lines, $145,000 scheduled, $49,250 completed, 34%.
select j.name, count(*) as lines,
       sum(scheduled_value_cents) / 100 as scheduled,
       sum(previous_completed_cents + this_period_cents + stored_cents) / 100 as completed
  from public.sov_lines s join public.jobs j on j.id = s.job_id
 where j.name like 'TEST — %'
 group by j.name;

-- ============================================================================
-- SWEEP before real use (same as the Sep 9 note, plus sov_lines):
--   delete from public.sov_lines  where job_id in (select id from public.jobs where name like 'TEST — %');
--   delete from public.crew_events where job_id in (select id from public.jobs where name like 'TEST — %');
--   delete from public.jobs where name like 'TEST — %';
--   delete from public.crews where name like 'TEST — %';
-- ============================================================================
