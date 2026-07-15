-- NARA BUSINESS LINK Version2
-- 商談管理、成功事例連携、会員スキル検索、検索ログを追加します。
-- 既存データは削除せず、必要な列と最小限のテーブルのみ追加します。

alter table public.profiles
  add column if not exists qualifications text[] default '{}',
  add column if not exists specialties text[] default '{}',
  add column if not exists available_work text,
  add column if not exists service_areas text[] default '{}',
  add column if not exists experience_years text,
  add column if not exists portfolio_url text,
  add column if not exists homepage_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists x_url text,
  add column if not exists other_sns_url text;

alter table public.successes
  add column if not exists deal_id uuid,
  add column if not exists counterpart_name text,
  add column if not exists introducer_name text,
  add column if not exists related_post_type text,
  add column if not exists related_post_id text;

create table if not exists public.business_deals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  introducer_id uuid references auth.users(id) on delete set null,
  requester_id uuid not null references auth.users(id) on delete cascade,
  contractor_id uuid not null references auth.users(id) on delete cascade,
  source_type text,
  source_id text,
  title text not null,
  category text,
  area text,
  description text,
  amount numeric,
  status text not null default 'started'
    check (status in ('started', 'in_progress', 'quoted', 'contracted', 'ongoing', 'closed')),
  comment text,
  success_id uuid,
  success_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_deals_requester_idx on public.business_deals(requester_id);
create index if not exists business_deals_contractor_idx on public.business_deals(contractor_id);
create index if not exists business_deals_status_idx on public.business_deals(status);
create index if not exists business_deals_created_at_idx on public.business_deals(created_at desc);
create index if not exists business_deals_source_idx on public.business_deals(source_type, source_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'successes_deal_id_fkey'
      and conrelid = 'public.successes'::regclass
  ) then
    alter table public.successes
      add constraint successes_deal_id_fkey
      foreign key (deal_id) references public.business_deals(id) on delete set null;
  end if;
end $$;

create table if not exists public.skill_search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  query text,
  qualification text,
  specialty text,
  service_area text,
  experience_years text,
  created_at timestamptz not null default now()
);

create index if not exists skill_search_logs_created_at_idx on public.skill_search_logs(created_at desc);
create index if not exists skill_search_logs_qualification_idx on public.skill_search_logs(qualification);
create index if not exists skill_search_logs_specialty_idx on public.skill_search_logs(specialty);
create index if not exists skill_search_logs_service_area_idx on public.skill_search_logs(service_area);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists business_deals_touch_updated_at on public.business_deals;
create trigger business_deals_touch_updated_at
before update on public.business_deals
for each row execute function public.touch_updated_at();

create or replace function public.admin_deal_summary()
returns table (
  total_deals bigint,
  contracted_deals bigint,
  ongoing_deals bigint,
  total_amount numeric,
  this_month_contracts bigint,
  consultation_count bigint,
  referral_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::bigint as total_deals,
    count(*) filter (where status in ('contracted', 'ongoing', 'closed'))::bigint as contracted_deals,
    count(*) filter (where status = 'ongoing')::bigint as ongoing_deals,
    coalesce(sum(amount) filter (where status in ('contracted', 'ongoing', 'closed')), 0)::numeric as total_amount,
    count(*) filter (
      where status in ('contracted', 'ongoing', 'closed')
        and date_trunc('month', updated_at) = date_trunc('month', now())
    )::bigint as this_month_contracts,
    count(*)::bigint as consultation_count,
    count(*) filter (where introducer_id is not null)::bigint as referral_count
  from public.business_deals
  where public.is_admin(auth.uid());
$$;

create or replace function public.admin_skill_rankings()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can view skill rankings';
  end if;

  select jsonb_build_object(
    'qualifications', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select value as name, count(*)::int as count
        from public.profiles, unnest(coalesce(qualifications, '{}')) as value
        where role in ('member', 'admin') and value <> ''
        group by value order by count(*) desc, value limit 20
      ) t
    ), '[]'::jsonb),
    'specialties', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select value as name, count(*)::int as count
        from public.profiles, unnest(coalesce(specialties, '{}')) as value
        where role in ('member', 'admin') and value <> ''
        group by value order by count(*) desc, value limit 20
      ) t
    ), '[]'::jsonb),
    'searches', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select coalesce(nullif(specialty, ''), nullif(qualification, ''), nullif(service_area, ''), nullif(query, ''), '未指定') as name,
               count(*)::int as count
        from public.skill_search_logs
        group by 1 order by count(*) desc, 1 limit 20
      ) t
    ), '[]'::jsonb),
    'consultations', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select p.id, coalesce(p.full_name, p.company_name, p.email, '未設定') as name, count(d.id)::int as count
        from public.profiles p
        left join public.business_deals d on d.contractor_id = p.id
        where p.role in ('member', 'admin')
        group by p.id, p.full_name, p.company_name, p.email
        order by count(d.id) desc, name limit 20
      ) t
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace view public.public_profiles as
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
  website_url,
  sns_url,
  qualifications,
  specialties,
  available_work,
  service_areas,
  experience_years,
  portfolio_url,
  homepage_url,
  instagram_url,
  facebook_url,
  x_url,
  other_sns_url,
  avatar_url,
  role,
  created_at,
  updated_at
from public.profiles
where role in ('member', 'admin');

alter table public.business_deals enable row level security;
alter table public.skill_search_logs enable row level security;

drop policy if exists "Approved users can create involved deals" on public.business_deals;
create policy "Approved users can create involved deals"
on public.business_deals for insert
with check (
  public.is_approved(auth.uid())
  and created_by = auth.uid()
  and (requester_id = auth.uid() or contractor_id = auth.uid() or introducer_id = auth.uid())
);

drop policy if exists "Deal participants and admins can read deals" on public.business_deals;
create policy "Deal participants and admins can read deals"
on public.business_deals for select
using (
  public.is_admin(auth.uid())
  or requester_id = auth.uid()
  or contractor_id = auth.uid()
  or introducer_id = auth.uid()
);

drop policy if exists "Deal participants and admins can update deals" on public.business_deals;
create policy "Deal participants and admins can update deals"
on public.business_deals for update
using (
  public.is_admin(auth.uid())
  or requester_id = auth.uid()
  or contractor_id = auth.uid()
  or introducer_id = auth.uid()
)
with check (
  public.is_admin(auth.uid())
  or requester_id = auth.uid()
  or contractor_id = auth.uid()
  or introducer_id = auth.uid()
);

drop policy if exists "Admins can delete deals" on public.business_deals;
create policy "Admins can delete deals"
on public.business_deals for delete
using (public.is_admin(auth.uid()));

drop policy if exists "Approved users can log skill searches" on public.skill_search_logs;
create policy "Approved users can log skill searches"
on public.skill_search_logs for insert
with check (auth.uid() is null or user_id = auth.uid());

drop policy if exists "Admins can read skill search logs" on public.skill_search_logs;
create policy "Admins can read skill search logs"
on public.skill_search_logs for select
using (public.is_admin(auth.uid()));
