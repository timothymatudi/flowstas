-- Per-visit log for the "See your visitors" page. Each HTML page view appends
-- one row so owners can see WHO visited (when, which page, where from, country,
-- device) — not just a daily count. Additive + safe to run multiple times.
-- Run: node scripts/run-sql.mjs scripts/add-visits.sql

create table if not exists public.site_visits (
  id         bigint generated always as identity primary key,
  site_id    text not null references public.sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  path       text,                 -- which page was viewed (e.g. "/" or "/about")
  referrer   text,                 -- where the visitor came from, if sent
  country    text,                 -- 2-letter country from the edge, if known
  device     text                  -- 'Mobile' | 'Tablet' | 'Desktop'
);

-- Fast "recent visits for this site" lookups.
create index if not exists site_visits_site_time_idx
  on public.site_visits (site_id, created_at desc);
