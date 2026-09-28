-- Remove member and content approval while preserving all existing data.
-- Legacy role/status columns remain for compatibility with existing queries.

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
    'member'
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
      role = case when public.profiles.role = 'admin' then 'admin' else 'member' end,
      rejected_at = null,
      updated_at = now();
  return new;
end;
$$;

update public.profiles
set role = case when role = 'admin' then 'admin' else 'member' end,
    rejected_at = null,
    updated_at = now()
where role <> 'admin' or rejected_at is not null;

create or replace function public.is_approved(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select check_user is not null;
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
      execute format('drop trigger if exists force_pending_content on public.%I', table_name);
      execute format('alter table public.%I alter column approval_status set default ''approved''', table_name);
      execute format('update public.%I set approval_status = ''approved'' where approval_status <> ''approved'' or approval_status is null', table_name);

      execute format('drop policy if exists "approval read gate" on public.%I', table_name);
      execute format('drop policy if exists "approval insert gate" on public.%I', table_name);
      execute format('drop policy if exists "approval update gate" on public.%I', table_name);
      execute format('drop policy if exists "approval delete gate" on public.%I', table_name);

      execute format('drop policy if exists "member content insert gate" on public.%I', table_name);
      execute format('create policy "member content insert gate" on public.%I as restrictive for insert with check (auth.uid() is not null and user_id = auth.uid())', table_name);
      execute format('drop policy if exists "owner content update gate" on public.%I', table_name);
      execute format('create policy "owner content update gate" on public.%I as restrictive for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin())', table_name);
      execute format('drop policy if exists "owner content delete gate" on public.%I', table_name);
      execute format('create policy "owner content delete gate" on public.%I as restrictive for delete using (user_id = auth.uid() or public.is_admin())', table_name);
    end if;
  end loop;
end $$;

drop policy if exists "profiles approved readable" on public.profiles;
create policy "profiles public readable" on public.profiles for select using (true);

drop policy if exists "approved users like" on public.likes;
create policy "members can like" on public.likes for insert
with check (auth.uid() is not null and user_id = auth.uid());
drop policy if exists "users unlike own" on public.likes;
create policy "users unlike own" on public.likes for delete
using (user_id = auth.uid());

drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations" on public.conversations for select
using (auth.uid() in (participant_one, participant_two));
drop policy if exists "approved users create conversations" on public.conversations;
create policy "members create conversations" on public.conversations for insert
with check (auth.uid() in (participant_one, participant_two));
drop policy if exists "participants update conversations" on public.conversations;
create policy "participants update conversations" on public.conversations for update
using (auth.uid() in (participant_one, participant_two));

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages for select
using (exists (
  select 1 from public.conversations c
  where c.id = conversation_id and auth.uid() in (c.participant_one, c.participant_two)
));
drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages" on public.messages for insert
with check (sender_id = auth.uid() and exists (
  select 1 from public.conversations c
  where c.id = conversation_id and auth.uid() in (c.participant_one, c.participant_two)
));
drop policy if exists "participants mark messages read" on public.messages;
create policy "participants mark messages read" on public.messages for update
using (exists (
  select 1 from public.conversations c
  where c.id = conversation_id and auth.uid() in (c.participant_one, c.participant_two)
));

drop policy if exists "published marche readable" on public.marche_posts;
create policy "public marche readable" on public.marche_posts for select using (true);
drop policy if exists "approved users create marche" on public.marche_posts;
drop policy if exists "owners update pending marche" on public.marche_posts;
drop policy if exists "owners delete marche" on public.marche_posts;

drop policy if exists "approved upload profile images" on storage.objects;
create policy "members upload profile images" on storage.objects for insert
with check (bucket_id = 'profile-images' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "approved upload marche images" on storage.objects;
create policy "members upload marche images" on storage.objects for insert
with check (bucket_id = 'marche-images' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "approved users upload business images" on storage.objects;
create policy "members upload business images" on storage.objects for insert
with check (bucket_id = 'business-images' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "business image approval gate" on storage.objects;
drop policy if exists "business image update approval gate" on storage.objects;

drop function if exists public.force_pending_content();
