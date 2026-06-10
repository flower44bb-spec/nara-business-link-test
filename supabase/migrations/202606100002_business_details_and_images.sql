-- NARA BUSINESS LINK: ensure every business form field can be persisted.
-- This migration is additive and preserves all existing rows and images.

alter table public.businesses add column if not exists name text;
alter table public.businesses add column if not exists title text;
alter table public.businesses add column if not exists category text;
alter table public.businesses add column if not exists area text;
alter table public.businesses add column if not exists description text;
alter table public.businesses add column if not exists services text;
alter table public.businesses add column if not exists collaboration_needs text;
alter table public.businesses add column if not exists contact text;
alter table public.businesses add column if not exists image_url text;
alter table public.businesses add column if not exists user_id uuid references public.profiles(id);
alter table public.businesses add column if not exists approval_status text not null default 'pending';

insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do update set public = true;

drop policy if exists "business images public read" on storage.objects;
create policy "business images public read" on storage.objects for select
using (bucket_id = 'business-images');

drop policy if exists "approved users upload business images" on storage.objects;
create policy "approved users upload business images" on storage.objects for insert
with check (
  bucket_id = 'business-images'
  and auth.uid()::text = (storage.foldername(name))[1]
  and public.is_approved()
);

drop policy if exists "owners update business images" on storage.objects;
create policy "owners update business images" on storage.objects for update
using (
  bucket_id = 'business-images'
  and auth.uid()::text = (storage.foldername(name))[1]
  and public.is_approved()
);

drop policy if exists "owners delete business images" on storage.objects;
create policy "owners delete business images" on storage.objects for delete
using (
  bucket_id = 'business-images'
  and auth.uid()::text = (storage.foldername(name))[1]
  and public.is_approved()
);
