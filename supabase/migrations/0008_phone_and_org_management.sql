-- Manager accounts are matched by phone number (prefer E.164, e.g. +9955XXXXXXXX).
-- Keep email too for existing administrator accounts and future contact workflows.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.organizations add column if not exists archived_at timestamptz;

update public.profiles p
set email = u.email,
    phone = u.phone
from auth.users u
where u.id = p.id
  and (p.email is distinct from u.email or p.phone is distinct from u.phone);

create unique index if not exists profiles_phone_unique
on public.profiles (phone)
where phone is not null and phone <> '';

create unique index if not exists profiles_email_lower_unique
on public.profiles (lower(email))
where email is not null and email <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    new.email,
    new.phone
  )
  on conflict (id) do update
    set email = excluded.email,
        phone = excluded.phone;
  return new;
end;
$$;

-- Sync Auth phone/email changes to the application profile.
create or replace function public.sync_auth_user_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email,
      phone = new.phone
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_contact_updated on auth.users;
create trigger on_auth_user_contact_updated
after update of email, phone on auth.users
for each row execute procedure public.sync_auth_user_contact();

-- Existing 0007 may not have been applied yet; preserve the one-manager-per-restaurant MVP rule.
create unique index if not exists one_manager_per_restaurant
on public.memberships (organization_id)
where role = 'manager';

-- Organization removal is archival, not destructive deletion, so historic sales,
-- bonuses and payout records remain intact and auditable.
create index if not exists organizations_active_idx
on public.organizations (created_at desc)
where archived_at is null;
