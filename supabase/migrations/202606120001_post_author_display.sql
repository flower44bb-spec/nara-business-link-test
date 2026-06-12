-- Expose only the minimum approved member fields needed beside public posts.

create or replace function public.get_post_authors(author_ids uuid[])
returns table (
  id uuid,
  full_name text,
  local_chapter text,
  company_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.full_name,
    profiles.local_chapter,
    profiles.company_name
  from public.profiles
  where profiles.id = any(author_ids)
    and profiles.role in ('admin', 'member');
$$;

revoke all on function public.get_post_authors(uuid[]) from public;
grant execute on function public.get_post_authors(uuid[]) to anon, authenticated;
