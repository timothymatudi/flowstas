-- Tables for the website-hosting product (published sites + their form messages).
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run multiple times.

create table if not exists public.sites (
  id         text primary key,
  name       text not null default 'Untitled site',
  html       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.site_submissions (
  id         uuid primary key default gen_random_uuid(),
  site_id    text not null references public.sites(id) on delete cascade,
  name       text,
  email      text,
  message    text,
  created_at timestamptz not null default now()
);

create index if not exists site_submissions_site_id_idx on public.site_submissions(site_id);
