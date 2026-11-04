-- Add winemakers as a first-class organization type.
alter table public.organizations
  drop constraint if exists organizations_kind_check;

alter table public.organizations
  add constraint organizations_kind_check
  check (kind in ('restaurant', 'supplier', 'winemaker'));
