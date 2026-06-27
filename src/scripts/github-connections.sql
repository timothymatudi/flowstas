-- One row per user who has connected their GitHub account to Flowstas (OAuth).
-- Lets customers deploy any of their repos — public OR private — without ever
-- pasting an access token: we store the OAuth token (encrypted) and use it for
-- clones on their behalf.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run multiple times.

create table if not exists public.github_connections (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  login      text not null,                 -- the connected GitHub username
  token_enc  text not null,                 -- AES-256-GCM OAuth token (key in APP_TOKEN_ENC_KEY)
  scope      text,                          -- granted OAuth scopes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Accessed only via the service-role admin client in server code, never from the
-- browser, so RLS stays on with no policies (deny-all to anon/auth roles).
alter table public.github_connections enable row level security;
