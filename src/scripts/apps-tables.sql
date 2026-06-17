-- Schema for the COMPUTE product (full apps that build + run on Fly, not static
-- sites). One row per deployed app. The build/run happens on Fly via the build
-- worker; this table is Flowstas's record of what belongs to whom.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run multiple times.

create table if not exists public.apps (
  id            text primary key,
  owner_id      uuid references auth.users(id) on delete set null,
  name          text not null default 'Untitled app',
  repo          text not null,                 -- https://github.com/owner/name
  branch        text,                          -- null = default branch
  fly_app       text not null unique,          -- the Fly app name we deploy to
  url           text,                          -- live URL once deployed
  custom_domain text,                          -- theirname.com, once attached
  status        text not null default 'building', -- building | live | error | stopped
  last_error    text,                          -- short reason when status = error
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists apps_owner_id_idx on public.apps(owner_id);

-- Per-deploy build log lines, so the dashboard can replay a build after the fact.
create table if not exists public.app_deploys (
  id         uuid primary key default gen_random_uuid(),
  app_id     text not null references public.apps(id) on delete cascade,
  status     text not null default 'building', -- building | live | error
  logs       text,                             -- full captured build output
  created_at timestamptz not null default now()
);

create index if not exists app_deploys_app_id_idx on public.app_deploys(app_id);
