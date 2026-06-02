-- Flowstas Supabase schema setup.
-- Safe to run multiple times (idempotent). Paste into:
--   Supabase Dashboard -> SQL Editor -> New query -> Run.

-- =========================================================
-- profiles: one row per user (read by the dashboard)
-- =========================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  updated_at  timestamptz default now()
);

-- =========================================================
-- subscriptions: one row per user (written by the Stripe webhook)
-- =========================================================
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references auth.users (id) on delete cascade,
  plan                    text,
  status                  text,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  trial_ends_at           timestamptz,
  updated_at              timestamptz default now()
);

-- =========================================================
-- contact_messages: submissions from the public contact form
-- =========================================================
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  first_name  text,
  last_name   text,
  email       text,
  subject     text,
  message     text,
  created_at  timestamptz default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (even logged-out visitors) may submit a message, but nobody can
-- read them back through the public API (view them in the Supabase dashboard).
drop policy if exists "anyone can submit contact" on public.contact_messages;
create policy "anyone can submit contact" on public.contact_messages
  for insert with check (true);

-- =========================================================
-- Row Level Security: users can read/update only their own rows.
-- (The webhook uses the service-role key, which bypasses RLS.)
-- =========================================================
alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "own profile select"  on public.profiles;
drop policy if exists "own profile update"  on public.profiles;
create policy "own profile select" on public.profiles
  for select using (auth.uid() = id);
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "own subscription select" on public.subscriptions;
create policy "own subscription select" on public.subscriptions
  for select using (auth.uid() = user_id);

-- =========================================================
-- Auto-create a profile row whenever a new user signs up.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Verify what now exists:
-- =========================================================
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'subscriptions')
order by table_name, ordinal_position;
