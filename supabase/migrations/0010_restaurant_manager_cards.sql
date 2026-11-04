-- Multiple manager profile cards can be created by WWW administrators per restaurant.
-- These are restaurant-side staff records, not Supabase Auth accounts.
create table if not exists public.restaurant_manager_cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create index if not exists restaurant_manager_cards_org_idx
on public.restaurant_manager_cards (organization_id, created_at);

alter table public.restaurant_manager_cards enable row level security;

drop policy if exists "platform admins manage restaurant manager cards" on public.restaurant_manager_cards;
create policy "platform admins manage restaurant manager cards"
on public.restaurant_manager_cards
for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

grant select, insert, update, delete on table public.restaurant_manager_cards to authenticated;
