alter table public.profiles
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '';

drop policy if exists "platform admins update all profiles" on public.profiles;
create policy "platform admins update all profiles"
on public.profiles for update to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());
