-- Extend marche_posts so the page can also be used for local event PR.
-- This is additive only and does not remove or rewrite existing data.

alter table public.marche_posts
  add column if not exists event_type text,
  add column if not exists organizer_type text,
  add column if not exists target_audience text;

comment on column public.marche_posts.event_type is
  'Listing type such as local event PR, marche, booth recruitment, youth league project, or company-hosted event.';
comment on column public.marche_posts.organizer_type is
  'Organizer category such as youth league, company, public organization, joint organizer, or other.';
comment on column public.marche_posts.target_audience is
  'Target audience for the event or recruitment.';
