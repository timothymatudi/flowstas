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
-- tasks: the core task manager (each user sees only their own)
-- =========================================================
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'todo',     -- 'todo' | 'in_progress' | 'done'
  priority    text not null default 'medium',   -- 'low' | 'medium' | 'high'
  due_date    date,
  position    integer not null default 0,
  created_at  timestamptz default now()
);

-- If an older version of this table exists, add the new columns safely.
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists status text not null default 'todo';
alter table public.tasks add column if not exists priority text not null default 'medium';
alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists position integer not null default 0;

alter table public.tasks enable row level security;

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

  -- Start every new user on a 1-day free trial. The dashboard reads
  -- subscriptions.trial_ends_at and status='trialing' to show the countdown;
  -- the Stripe webhook later upgrades this row to status='active'.
  insert into public.subscriptions (user_id, plan, status, trial_ends_at)
  values (new.id, 'trial', 'trialing', now() + interval '1 day')
  on conflict (user_id) do nothing;

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
