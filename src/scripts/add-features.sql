-- Schema for the new feature set: analytics, password-protect, custom domains.
-- Additive + safe to run multiple times.
-- Run: node scripts/run-sql.mjs scripts/add-features.sql

-- Password-protect: bcrypt-style hash (null = public site).
alter table public.sites add column if not exists password_hash text;

-- Custom domain (e.g. www.yourbiz.com) mapped to this site. Unique per host.
alter table public.sites add column if not exists custom_domain text;
create unique index if not exists sites_custom_domain_key on public.sites(lower(custom_domain));

-- Per-day view counts for the visitor-analytics feature.
create table if not exists public.site_view_stats (
  site_id text not null references public.sites(id) on delete cascade,
  day     date not null default current_date,
  views   integer not null default 0,
  primary key (site_id, day)
);
