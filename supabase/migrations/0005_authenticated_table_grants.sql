-- Ensure authenticated clients have SQL privileges on the tables protected by RLS.
-- RLS policies remain the row-level authorization boundary.
grant select, insert, update, delete on table public.organizations to authenticated;
grant select, insert, update, delete on table public.memberships to authenticated;
grant select, insert, update on table public.profiles to authenticated;
