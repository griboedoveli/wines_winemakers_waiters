-- MVP platform administration: only explicitly promoted WWW admins can manage organizations and memberships.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = auth.uid()
  );
$$;

-- Create a profile automatically for every new Supabase Auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- WWW admins can see and manage all organizations.
create policy "platform admins view all organizations"
on public.organizations for select to authenticated
using (public.is_platform_admin());

create policy "platform admins create organizations"
on public.organizations for insert to authenticated
with check (public.is_platform_admin());

create policy "platform admins update organizations"
on public.organizations for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "platform admins delete organizations"
on public.organizations for delete to authenticated
using (public.is_platform_admin());

-- WWW admins can manage organization memberships (role assignment).
create policy "platform admins view all memberships"
on public.memberships for select to authenticated
using (public.is_platform_admin());

create policy "platform admins create memberships"
on public.memberships for insert to authenticated
with check (public.is_platform_admin());

create policy "platform admins update memberships"
on public.memberships for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "platform admins delete memberships"
on public.memberships for delete to authenticated
using (public.is_platform_admin());

create policy "platform admins view all profiles"
on public.profiles for select to authenticated
using (public.is_platform_admin());
