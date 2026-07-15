-- Reliable admin RPC for featured content.
-- This includes the additive columns so applying this file alone is enough.

alter table public.businesses
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.problems
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.collaborations
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.successes
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.marche_posts
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

create index if not exists businesses_featured_idx
  on public.businesses(is_featured desc, featured_at desc, created_at desc);
create index if not exists problems_featured_idx
  on public.problems(is_featured desc, featured_at desc, created_at desc);
create index if not exists collaborations_featured_idx
  on public.collaborations(is_featured desc, featured_at desc, created_at desc);
create index if not exists successes_featured_idx
  on public.successes(is_featured desc, featured_at desc, created_at desc);
create index if not exists marche_posts_featured_idx
  on public.marche_posts(is_featured desc, featured_at desc, event_date desc);

create or replace function public.admin_set_featured_status(
  target_table text,
  target_id uuid,
  next_featured boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator permission is required';
  end if;

  if target_table not in (
    'businesses',
    'problems',
    'collaborations',
    'successes',
    'marche_posts'
  ) then
    raise exception 'Unsupported content table';
  end if;

  execute format(
    'update public.%I
       set is_featured = $1,
           featured_at = case when $1 then now() else null end
     where id = $2',
    target_table
  )
  using next_featured, target_id;
end;
$$;

revoke all on function public.admin_set_featured_status(text, uuid, boolean) from public;
grant execute on function public.admin_set_featured_status(text, uuid, boolean) to authenticated;
