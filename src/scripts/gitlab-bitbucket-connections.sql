-- One row per user who has connected their GitLab or Bitbucket account to
-- Flowstas (OAuth). Mirrors github_connections: lets customers deploy any of
-- their repos — public OR private — without ever pasting an access token. We
-- store the OAuth token (encrypted) and use it for clones on their behalf.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run multiple times.

create table if not exists public.gitlab_connections (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  login      text not null,                 -- the connected GitLab username
  token_enc  text not null,                 -- AES-256-GCM OAuth token (key in APP_TOKEN_ENC_KEY)
  scope      text,                          -- granted OAuth scopes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bitbucket_connections (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  login      text not null,                 -- the connected Bitbucket username
  token_enc  text not null,                 -- AES-256-GCM OAuth token (key in APP_TOKEN_ENC_KEY)
  scope      text,                          -- granted OAuth scopes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Accessed only via the service-role admin client in server code, never from the
-- browser, so RLS stays on with no policies (deny-all to anon/auth roles).
alter table public.gitlab_connections enable row level security;
alter table public.bitbucket_connections enable row level security;
