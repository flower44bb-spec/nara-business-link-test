-- NARA BUSINESS LINK: approval, admin, likes, messaging, notifications,
-- marche posts and member profiles.
-- This migration is additive. It does not drop tables or delete existing data.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  local_chapter text,
  position text,
  company_name text,
  industry text,
  bio text,
  can_help_with text,
  wants_to_connect_with text,
  avatar_url text,
  line_user_id text,
  line_notify_target text,
  line_notifications_enabled boolean not null default false,
  rejected_at timestamptz,
  role text not null default 'pending'
    check (role in ('admin', 'member', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists local_chapter text;
alter table public.profiles add column if not exists position text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists can_help_with text;
alter table public.profiles add column if not exists wants_to_connect_with text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists line_user_id text;
alter table public.profiles add column if not exists line_notify_target text;
alter table public.profiles add column if not exists line_notifications_enabled boolean not null default false;
alter table public.profiles add column if not exists rejected_at timestamptz;
alter table public.profiles add column if not exists role text not null default 'pending';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

insert into public.profiles (id, email, full_name, role)
select
  id,
  email,
  coalesce(raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'full_name', ''),
  'member'
from auth.users
on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and role = 'admin'
  );
$$;

create or replace function public.is_approved(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and role in ('admin', 'member')
  );
$$;

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.role := old.role;
    new.rejected_at := old.rejected_at;
    new.email := old.email;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_admin_fields on public.profiles;
create trigger protect_profile_admin_fields
  before update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

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
  updated_at
from public.profiles
where role in ('admin', 'member');

grant select on public.public_profiles to anon, authenticated;

-- Existing records remain published. New records require approval.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['businesses', 'problems', 'collaborations', 'successes']
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format(
        'alter table public.%I add column if not exists approval_status text',
        table_name
      );
      execute format(
        'update public.%I set approval_status = ''approved'' where approval_status is null',
        table_name
      );
      execute format(
        'alter table public.%I alter column approval_status set default ''pending''',
        table_name
      );
      execute format(
        'alter table public.%I alter column approval_status set not null',
        table_name
      );
    end if;
  end loop;
end $$;

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null
    check (target_type in ('businesses', 'problems', 'collaborations', 'successes', 'marche_posts')),
  target_id text not null,
  target_owner_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists likes_target_idx on public.likes(target_type, target_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references public.profiles(id) on delete cascade,
  participant_two uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (participant_one <> participant_two)
);
create unique index if not exists conversations_pair_unique
  on public.conversations (
    least(participant_one::text, participant_two::text),
    greatest(participant_one::text, participant_two::text)
  );

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx
  on public.messages(conversation_id, created_at);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  event_type text not null
    check (event_type in ('like_received', 'dm_received', 'pending_user', 'post_approval_requested')),
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  delivery_channel text not null default 'line',
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists notification_logs_recipient_idx
  on public.notification_logs(recipient_id, created_at desc);

create table if not exists public.marche_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_name text not null,
  event_date date not null,
  location text not null,
  desired_industries text,
  description text not null,
  application_deadline date,
  booth_fee text,
  organizer text not null,
  image_url text,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marche_posts_date_idx on public.marche_posts(event_date);

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('marche-images', 'marche-images', true)
on conflict (id) do update set public = true;

-- Notification queue writers. A future Edge Function can deliver pending rows.
create or replace function public.log_new_profile_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_logs (recipient_id, event_type, title, body, payload)
  select id, 'pending_user', '新しい会員登録', coalesce(new.full_name, new.email, '新規会員') || 'さんの承認待ちです',
    jsonb_build_object('profile_id', new.id)
  from public.profiles where role = 'admin';
  return new;
end;
$$;
drop trigger if exists notify_admin_new_profile on public.profiles;
create trigger notify_admin_new_profile
  after insert on public.profiles
  for each row when (new.role = 'pending')
  execute function public.log_new_profile_notification();

create or replace function public.log_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target_owner_id is not null and new.target_owner_id <> new.user_id then
    insert into public.notification_logs
      (recipient_id, event_type, title, body, payload)
    values
      (new.target_owner_id, 'like_received', 'いいねが届きました',
       'あなたの投稿にいいねが付きました',
       jsonb_build_object('target_type', new.target_type, 'target_id', new.target_id));
  end if;
  return new;
end;
$$;
drop trigger if exists notify_like_received on public.likes;
create trigger notify_like_received
  after insert on public.likes
  for each row execute function public.log_like_notification();

create or replace function public.log_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
begin
  select case
    when participant_one = new.sender_id then participant_two
    else participant_one
  end into recipient
  from public.conversations where id = new.conversation_id;

  insert into public.notification_logs
    (recipient_id, event_type, title, body, payload)
  values
    (recipient, 'dm_received', '新しいDM', left(new.body, 120),
     jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id));
  return new;
end;
$$;
drop trigger if exists notify_dm_received on public.messages;
create trigger notify_dm_received
  after insert on public.messages
  for each row execute function public.log_message_notification();

create or replace function public.log_post_approval_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_logs (recipient_id, event_type, title, body, payload)
  select id, 'post_approval_requested', '新しい投稿の承認依頼',
    tg_table_name || ' に新しい投稿があります',
    jsonb_build_object('table', tg_table_name, 'record_id', new.id)
  from public.profiles where role = 'admin';
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'businesses', 'problems', 'collaborations', 'successes', 'marche_posts'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists notify_admin_%I on public.%I', table_name, table_name);
      execute format(
        'create trigger notify_admin_%I after insert on public.%I for each row execute function public.log_post_approval_request()',
        table_name, table_name
      );
    end if;
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notification_logs enable row level security;
alter table public.marche_posts enable row level security;

drop policy if exists "profiles approved readable" on public.profiles;
create policy "profiles approved readable" on public.profiles for select
using (
  (public.is_approved() and role in ('admin', 'member'))
  or id = auth.uid()
  or public.is_admin()
);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles admin manage" on public.profiles;
create policy "profiles admin manage" on public.profiles for all
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "likes readable" on public.likes;
create policy "likes readable" on public.likes for select using (true);
drop policy if exists "approved users like" on public.likes;
create policy "approved users like" on public.likes for insert
with check (user_id = auth.uid() and public.is_approved());
drop policy if exists "users unlike own" on public.likes;
create policy "users unlike own" on public.likes for delete
using (user_id = auth.uid() and public.is_approved());

drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations" on public.conversations for select
using (auth.uid() in (participant_one, participant_two) and public.is_approved());
drop policy if exists "approved users create conversations" on public.conversations;
create policy "approved users create conversations" on public.conversations for insert
with check (
  auth.uid() in (participant_one, participant_two)
  and public.is_approved()
  and public.is_approved(
    case when auth.uid() = participant_one then participant_two else participant_one end
  )
);
drop policy if exists "participants update conversations" on public.conversations;
create policy "participants update conversations" on public.conversations for update
using (auth.uid() in (participant_one, participant_two) and public.is_approved());

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages for select
using (
  public.is_approved() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.participant_one, c.participant_two)
  )
);
drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages" on public.messages for insert
with check (
  sender_id = auth.uid() and public.is_approved() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.participant_one, c.participant_two)
  )
);
drop policy if exists "participants mark messages read" on public.messages;
create policy "participants mark messages read" on public.messages for update
using (
  public.is_approved() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.participant_one, c.participant_two)
  )
);

drop policy if exists "users read own notification logs" on public.notification_logs;
create policy "users read own notification logs" on public.notification_logs for select
using (recipient_id = auth.uid() or public.is_admin());
drop policy if exists "system and admins create notification logs" on public.notification_logs;
create policy "system and admins create notification logs" on public.notification_logs for insert
with check (public.is_admin());
drop policy if exists "admins update notification logs" on public.notification_logs;
create policy "admins update notification logs" on public.notification_logs for update
using (public.is_admin());

drop policy if exists "published marche readable" on public.marche_posts;
create policy "published marche readable" on public.marche_posts for select
using (approval_status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists "approved users create marche" on public.marche_posts;
create policy "approved users create marche" on public.marche_posts for insert
with check (user_id = auth.uid() and public.is_approved());
drop policy if exists "owners update pending marche" on public.marche_posts;
create policy "owners update pending marche" on public.marche_posts for update
using ((user_id = auth.uid() and public.is_approved()) or public.is_admin());
drop policy if exists "owners delete marche" on public.marche_posts;
create policy "owners delete marche" on public.marche_posts for delete
using ((user_id = auth.uid() and public.is_approved()) or public.is_admin());

-- Apply restrictive approval policies to existing content tables.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['businesses', 'problems', 'collaborations', 'successes']
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists "approval read gate" on public.%I', table_name);
      execute format('drop policy if exists "content base read" on public.%I', table_name);
      execute format(
        'create policy "content base read" on public.%I for select using (true)',
        table_name
      );
      execute format(
        'create policy "approval read gate" on public.%I as restrictive for select using (approval_status = ''approved'' or user_id = auth.uid() or public.is_admin())',
        table_name
      );
      execute format('drop policy if exists "approval insert gate" on public.%I', table_name);
      execute format('drop policy if exists "content base insert" on public.%I', table_name);
      execute format(
        'create policy "content base insert" on public.%I for insert with check (auth.uid() is not null)',
        table_name
      );
      execute format(
        'create policy "approval insert gate" on public.%I as restrictive for insert with check (user_id = auth.uid() and public.is_approved())',
        table_name
      );
      execute format('drop policy if exists "approval update gate" on public.%I', table_name);
      execute format('drop policy if exists "content base update" on public.%I', table_name);
      execute format(
        'create policy "content base update" on public.%I for update using (auth.uid() is not null)',
        table_name
      );
      execute format(
        'create policy "approval update gate" on public.%I as restrictive for update using ((user_id = auth.uid() and public.is_approved()) or public.is_admin())',
        table_name
      );
      execute format('drop policy if exists "approval delete gate" on public.%I', table_name);
      execute format('drop policy if exists "content base delete" on public.%I', table_name);
      execute format(
        'create policy "content base delete" on public.%I for delete using (auth.uid() is not null)',
        table_name
      );
      execute format(
        'create policy "approval delete gate" on public.%I as restrictive for delete using ((user_id = auth.uid() and public.is_approved()) or public.is_admin())',
        table_name
      );
    end if;
  end loop;
end $$;

drop policy if exists "approved upload profile images" on storage.objects;
create policy "approved upload profile images" on storage.objects for insert
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
  and public.is_approved()
);
drop policy if exists "profile images public read" on storage.objects;
create policy "profile images public read" on storage.objects for select
using (bucket_id = 'profile-images');
drop policy if exists "owners update profile images" on storage.objects;
create policy "owners update profile images" on storage.objects for update
using (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "approved upload marche images" on storage.objects;
create policy "approved upload marche images" on storage.objects for insert
with check (
  bucket_id = 'marche-images'
  and auth.uid()::text = (storage.foldername(name))[1]
  and public.is_approved()
);
drop policy if exists "marche images public read" on storage.objects;
create policy "marche images public read" on storage.objects for select
using (bucket_id = 'marche-images');

drop policy if exists "business image approval gate" on storage.objects;
create policy "business image approval gate" on storage.objects
  as restrictive for insert
with check (
  bucket_id <> 'business-images'
  or (
    auth.uid()::text = (storage.foldername(name))[1]
    and public.is_approved()
  )
);
drop policy if exists "business image update approval gate" on storage.objects;
create policy "business image update approval gate" on storage.objects
  as restrictive for update
using (
  bucket_id <> 'business-images'
  or (
    auth.uid()::text = (storage.foldername(name))[1]
    and public.is_approved()
  )
);

-- IMPORTANT: After running this migration, promote the first administrator:
-- update public.profiles
-- set role = 'admin'
-- where email = 'YOUR_ADMIN_EMAIL@example.com';
