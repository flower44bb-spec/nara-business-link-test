-- Allow admins to choose content that should be shown before regular posts.
-- Additive only: existing rows remain unchanged and default to non-featured.

alter table public.businesses
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.problems
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.collaborations
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.successes
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

alter table public.marche_posts
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_at timestamptz;

create index if not exists businesses_featured_idx
  on public.businesses(is_featured desc, featured_at desc, created_at desc);
create index if not exists problems_featured_idx
  on public.problems(is_featured desc, featured_at desc, created_at desc);
create index if not exists collaborations_featured_idx
  on public.collaborations(is_featured desc, featured_at desc, created_at desc);
create index if not exists successes_featured_idx
  on public.successes(is_featured desc, featured_at desc, created_at desc);
create index if not exists marche_posts_featured_idx
  on public.marche_posts(is_featured desc, featured_at desc, event_date desc);
