-- Ensure profile editing and cropped profile/marche image uploads work.
-- Additive only: existing profiles, posts, and images are preserved.

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists local_chapter text;
alter table public.profiles add column if not exists position text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists can_help_with text;
alter table public.profiles add column if not exists wants_to_connect_with text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists line_notify_target text;
alter table public.profiles add column if not exists line_notifications_enabled boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.marche_posts add column if not exists image_url text;
alter table public.marche_posts add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

insert into storage.buckets (id, name, public)
values
  ('profile-images', 'profile-images', true),
  ('marche-images', 'marche-images', true)
on conflict (id) do update set public = true;

drop policy if exists "profile images public read" on storage.objects;
create policy "profile images public read" on storage.objects for select
using (bucket_id = 'profile-images');

drop policy if exists "approved upload profile images" on storage.objects;
create policy "approved upload profile images" on storage.objects for insert
with check (
  bucket_id = 'profile-images'
  and auth.uid()::text = (storage.foldername(name))[1]
  and public.is_approved()
);

drop policy if exists "marche images public read" on storage.objects;
create policy "marche images public read" on storage.objects for select
using (bucket_id = 'marche-images');

drop policy if exists "approved upload marche images" on storage.objects;
create policy "approved upload marche images" on storage.objects for insert
with check (
  bucket_id = 'marche-images'
  and auth.uid()::text = (storage.foldername(name))[1]
  and public.is_approved()
);
