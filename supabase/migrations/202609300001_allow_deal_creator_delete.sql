-- Allow a member to remove only a deal that they created themselves.
-- Existing admin deletion policy and all existing data remain unchanged.
drop policy if exists "Creators can delete own deals" on public.business_deals;
create policy "Creators can delete own deals"
on public.business_deals for delete
using (created_by = auth.uid());
