-- Contact form storage + anonymous INSERT policy.
-- app/actions/contact.ts inserts via the anon/cookie Supabase client into
-- public.contact_messages. Without this table + an anon INSERT policy, every
-- visitor submission silently errors. Idempotent: safe to re-run.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  subject     text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Allow anonymous visitors to submit (INSERT only). No SELECT policy, so the
-- anon key cannot read other people's messages; the service-role client (used
-- server-side) bypasses RLS for any admin reads.
drop policy if exists "anon insert contact" on public.contact_messages;
create policy "anon insert contact"
  on public.contact_messages
  for insert
  to anon
  with check (true);

-- Also let signed-in (authenticated) sessions submit, in case the form is used
-- while logged in.
drop policy if exists "authenticated insert contact" on public.contact_messages;
create policy "authenticated insert contact"
  on public.contact_messages
  for insert
  to authenticated
  with check (true);
