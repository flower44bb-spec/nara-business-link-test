-- Add public profile link fields.
-- Additive only: existing member data is preserved.

alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists sns_url text;

create or replace view public.public_profiles
with (security_invoker = true)
as
select
  id,
  full_name,
  local_chapter,
  position,
  company_name,
  industry,
  bio,
  can_help_with,
  wants_to_connect_with,
  avatar_url,
  role,
  created_at,
  updated_at,
  website_url,
  sns_url
from public.profiles
where role in ('admin', 'member');

grant select on public.public_profiles to anon, authenticated;
