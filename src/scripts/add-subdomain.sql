-- Give each published site a clean subdomain slug (served at <slug>.flowstas.com).
-- Additive + safe to run multiple times.
-- Run: node scripts/run-sql.mjs scripts/add-subdomain.sql

alter table public.sites add column if not exists subdomain text;

-- Backfill any existing rows that have no slug yet: use the site id (always unique).
update public.sites set subdomain = id where subdomain is null;

-- One site per slug.
create unique index if not exists sites_subdomain_key on public.sites(lower(subdomain));
