-- Login audit trail for administrators.
-- Records successful app logins without changing existing auth data.

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists login_events_created_at_idx
  on public.login_events(created_at desc);

create index if not exists login_events_user_id_idx
  on public.login_events(user_id, created_at desc);

alter table public.login_events enable row level security;

drop policy if exists "Users can record own login events" on public.login_events;
create policy "Users can record own login events"
on public.login_events for insert
with check (auth.uid() = user_id);

drop policy if exists "Admins can read login events" on public.login_events;
create policy "Admins can read login events"
on public.login_events for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete login events" on public.login_events;
create policy "Admins can delete login events"
on public.login_events for delete
using (public.is_admin(auth.uid()));
