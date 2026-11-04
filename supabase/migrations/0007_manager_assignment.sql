-- Store the Auth email on the application profile so WWW admins can assign existing accounts by email.
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is distinct from u.email);

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
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

-- MVP: one manager account per restaurant.
create unique index if not exists one_manager_per_restaurant
on public.memberships (organization_id)
where role = 'manager';
