-- Instagram publishing audit log.
-- Additive only: no existing tables or data are removed.

create table if not exists public.instagram_publish_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  instagram_media_id text,
  caption text not null,
  image_url text not null,
  permalink text,
  status text not null check (status in ('published', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists instagram_publish_logs_created_idx
  on public.instagram_publish_logs(created_at desc);

alter table public.instagram_publish_logs enable row level security;

drop policy if exists "Admins can read Instagram publish logs"
  on public.instagram_publish_logs;
create policy "Admins can read Instagram publish logs"
  on public.instagram_publish_logs
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can create Instagram publish logs"
  on public.instagram_publish_logs;
create policy "Admins can create Instagram publish logs"
  on public.instagram_publish_logs
  for insert
  to authenticated
  with check (public.is_admin() and published_by = auth.uid());
