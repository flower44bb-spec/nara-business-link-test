-- Privacy-conscious page view analytics for the administrator dashboard.
-- This migration is additive and does not alter or delete existing content.

create extension if not exists pgcrypto;

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null check (char_length(path) between 1 and 500),
  visitor_id uuid not null,
  session_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  referrer_host text,
  device_type text not null default 'desktop'
    check (device_type in ('mobile', 'tablet', 'desktop')),
  viewed_on date not null default ((now() at time zone 'Asia/Tokyo')::date),
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_idx
  on public.page_views(created_at desc);
create index if not exists page_views_date_idx
  on public.page_views(viewed_on);
create index if not exists page_views_visitor_idx
  on public.page_views(visitor_id, created_at desc);

alter table public.page_views enable row level security;

drop policy if exists "Anyone can record page views" on public.page_views;
create policy "Anyone can record page views"
  on public.page_views
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "Admins can read page views" on public.page_views;
create policy "Admins can read page views"
  on public.page_views
  for select
  to authenticated
  using (public.is_admin());

create or replace function public.admin_analytics_summary(period_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  start_date date := (now() at time zone 'Asia/Tokyo')::date - greatest(period_days - 1, 0);
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator permission is required';
  end if;

  return jsonb_build_object(
    'total_views', (select count(*) from public.page_views),
    'period_views', (select count(*) from public.page_views where viewed_on >= start_date),
    'unique_visitors', (select count(distinct visitor_id) from public.page_views where viewed_on >= start_date),
    'logged_in_visitors', (select count(distinct user_id) from public.page_views where viewed_on >= start_date and user_id is not null),
    'monthly_active_auth_users', (
      select count(*)
      from auth.users
      where last_sign_in_at >= start_date::timestamptz
    ),
    'registered_members', (select count(*) from public.profiles),
    'approved_members', (select count(*) from public.profiles where role in ('admin', 'member')),
    'pending_members', (select count(*) from public.profiles where role = 'pending' and rejected_at is null),
    'new_members', (select count(*) from public.profiles where created_at >= start_date::timestamptz),
    'registered_businesses', (select count(*) from public.businesses),
    'approved_businesses', (select count(*) from public.businesses where approval_status = 'approved'),
    'pending_businesses', (select count(*) from public.businesses where approval_status = 'pending'),
    'total_posts',
      (select count(*) from public.businesses) +
      (select count(*) from public.problems) +
      (select count(*) from public.collaborations) +
      (select count(*) from public.successes) +
      (select count(*) from public.marche_posts),
    'likes', (select count(*) from public.likes),
    'messages', (select count(*) from public.messages),
    'database_bytes', pg_database_size(current_database()),
    'storage_bytes', (
      select coalesce(sum(
        case
          when metadata ->> 'size' ~ '^[0-9]+$' then (metadata ->> 'size')::bigint
          else 0
        end
      ), 0)
      from storage.objects
    ),
    'storage_objects', (select count(*) from storage.objects)
  );
end;
$$;

create or replace function public.admin_daily_page_views(period_days integer default 30)
returns table(view_date date, views bigint, visitors bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator permission is required';
  end if;

  return query
  with dates as (
    select generate_series(
      (now() at time zone 'Asia/Tokyo')::date - greatest(period_days - 1, 0),
      (now() at time zone 'Asia/Tokyo')::date,
      interval '1 day'
    )::date as day
  )
  select
    dates.day,
    count(page_views.id)::bigint,
    count(distinct page_views.visitor_id)::bigint
  from dates
  left join public.page_views on page_views.viewed_on = dates.day
  group by dates.day
  order by dates.day;
end;
$$;

create or replace function public.admin_top_pages(
  period_days integer default 30,
  result_limit integer default 5
)
returns table(path text, views bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator permission is required';
  end if;

  return query
  select page_views.path, count(*)::bigint
  from public.page_views
  where viewed_on >= (now() at time zone 'Asia/Tokyo')::date - greatest(period_days - 1, 0)
  group by page_views.path
  order by count(*) desc, page_views.path
  limit greatest(result_limit, 1);
end;
$$;

revoke all on function public.admin_analytics_summary(integer) from public;
revoke all on function public.admin_daily_page_views(integer) from public;
revoke all on function public.admin_top_pages(integer, integer) from public;
grant execute on function public.admin_analytics_summary(integer) to authenticated;
grant execute on function public.admin_daily_page_views(integer) to authenticated;
grant execute on function public.admin_top_pages(integer, integer) to authenticated;
