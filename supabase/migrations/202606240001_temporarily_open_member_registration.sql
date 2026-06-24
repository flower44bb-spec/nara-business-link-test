-- Temporarily open member registration.
-- New sign-ups become approved members immediately instead of waiting for admin approval.
-- Existing non-rejected pending users are also promoted so they can use member features.

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
      role = case
        when public.profiles.role = 'admin' then 'admin'
        else 'member'
      end,
      rejected_at = null,
      updated_at = now();

  return new;
end;
$$;

update public.profiles
set
  role = 'member',
  rejected_at = null,
  updated_at = now()
where role = 'pending'
  and rejected_at is null;
