-- Schema for the website-hosting product (published sites + their form messages).
-- Site files live in the Storage bucket "sites"; this provisions the metadata
-- tables and that bucket.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run multiple times.

-- One row per published site. The actual files are in Storage, not here.
create table if not exists public.sites (
  id         text primary key,
  name       text not null default 'Untitled site',
  file_count integer not null default 1,
  created_at timestamptz not null default now()
);

-- Migrate older single-page schema (which stored the page in an `html` column).
alter table public.sites add column if not exists file_count integer not null default 1;
alter table public.sites drop column if exists html;

create table if not exists public.site_submissions (
  id         uuid primary key default gen_random_uuid(),
  site_id    text not null references public.sites(id) on delete cascade,
  name       text,
  email      text,
  message    text,
  created_at timestamptz not null default now()
);

create index if not exists site_submissions_site_id_idx on public.site_submissions(site_id);

-- Private bucket holding each site's files under "<site_id>/<path>".
-- The app reads/writes it server-side with the service-role key, so no public
-- access or RLS policies are needed here.
insert into storage.buckets (id, name, public)
values ('sites', 'sites', false)
on conflict (id) do nothing;
