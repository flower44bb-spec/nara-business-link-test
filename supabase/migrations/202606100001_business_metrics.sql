-- NARA BUSINESS LINK: public activity metrics.
-- This migration is additive and preserves all existing rows.

alter table public.collaborations
  add column if not exists collaboration_status text not null default 'open';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'collaborations_status_check'
      and conrelid = 'public.collaborations'::regclass
  ) then
    alter table public.collaborations
      add constraint collaborations_status_check
      check (collaboration_status in ('open', 'successful'));
  end if;
end $$;

alter table public.problems
  add column if not exists resolved_at timestamptz;

alter table public.successes
  add column if not exists transaction_amount bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'successes_transaction_amount_check'
      and conrelid = 'public.successes'::regclass
  ) then
    alter table public.successes
      add constraint successes_transaction_amount_check
      check (transaction_amount is null or transaction_amount >= 0);
  end if;
end $$;

create index if not exists collaborations_successful_idx
  on public.collaborations(collaboration_status)
  where approval_status = 'approved';

create index if not exists problems_resolved_idx
  on public.problems(resolved_at)
  where approval_status = 'approved' and resolved_at is not null;
