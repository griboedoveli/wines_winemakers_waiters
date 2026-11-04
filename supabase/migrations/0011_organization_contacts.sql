-- Store a primary contact person and phone on each organization card.
alter table public.organizations
  add column if not exists contact_first_name text,
  add column if not exists contact_last_name text,
  add column if not exists contact_phone text;
