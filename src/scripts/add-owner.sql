-- Scope published sites to the user who created them.
alter table public.sites add column if not exists owner_id uuid references auth.users(id) on delete set null;
create index if not exists sites_owner_id_idx on public.sites(owner_id);
