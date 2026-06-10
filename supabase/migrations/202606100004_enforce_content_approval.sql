-- Enforce moderation after every member edit and provide a reliable admin RPC.
-- Existing rows and data are preserved.

create or replace function public.force_pending_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.approval_status := 'pending';
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'businesses',
    'problems',
    'collaborations',
    'successes',
    'marche_posts'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format(
        'drop trigger if exists force_pending_content on public.%I',
        table_name
      );
      execute format(
        'create trigger force_pending_content before insert or update on public.%I
         for each row execute function public.force_pending_content()',
        table_name
      );
    end if;
  end loop;
end;
$$;

create or replace function public.admin_set_content_status(
  target_table text,
  target_id uuid,
  next_status text
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

  if next_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Unsupported approval status';
  end if;

  execute format(
    'update public.%I set approval_status = $1 where id = $2',
    target_table
  )
  using next_status, target_id;
end;
$$;

revoke all on function public.admin_set_content_status(text, uuid, text) from public;
grant execute on function public.admin_set_content_status(text, uuid, text) to authenticated;
