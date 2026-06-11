-- Allow administrators to remove an Auth account and its profile safely.
-- Content owned by the removed account is deleted with its related data.

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_role text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception '管理者のみ会員を削除できます。';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'ログイン中の管理者本人は削除できません。';
  end if;

  select role into target_role
  from public.profiles
  where id = target_user_id;

  if target_role is null then
    raise exception '対象の会員が見つかりません。';
  end if;

  if target_role = 'admin'
    and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception '最後の管理者は削除できません。';
  end if;

  delete from public.businesses where user_id = target_user_id;
  delete from public.problems where user_id = target_user_id;
  delete from public.collaborations where user_id = target_user_id;
  delete from public.successes where user_id = target_user_id;
  delete from public.marche_posts where user_id = target_user_id;

  delete from auth.users where id = target_user_id;

  if not found then
    raise exception '認証アカウントが見つかりません。';
  end if;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
