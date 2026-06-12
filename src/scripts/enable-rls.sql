-- Lock the hosting tables to server-side (service-role) access only.
-- RLS on + no policies = the public anon/authenticated keys get NO access via
-- PostgREST, while the app's service-role client still reads/writes freely.
-- This protects contact-form PII in site_submissions.
alter table public.sites enable row level security;
alter table public.site_submissions enable row level security;
