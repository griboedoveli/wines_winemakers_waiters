-- Public self-registration after verified phone authentication.
create or replace function public.register_organization(
  p_name text,
  p_kind text,
  p_first_name text,
  p_last_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_auth_phone text;
  v_org_id uuid;
  v_role public.member_role;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[[:space:]()-]', '', 'g');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select phone into v_auth_phone
  from auth.users
  where id = v_user_id
    and phone_confirmed_at is not null;

  if v_auth_phone is null then
    raise exception 'Phone number must be verified first';
  end if;

  if regexp_replace(v_auth_phone, '[[:space:]()-]', '', 'g') <> v_phone then
    raise exception 'Verified phone number does not match';
  end if;

  if coalesce(trim(p_name), '') = ''
     or coalesce(trim(p_first_name), '') = ''
     or coalesce(trim(p_last_name), '') = ''
     or v_phone = '' then
    raise exception 'All registration fields are required';
  end if;

  if p_kind not in ('restaurant', 'winemaker', 'supplier') then
    raise exception 'Invalid organization type';
  end if;

  if exists (select 1 from public.memberships where user_id = v_user_id) then
    raise exception 'This account is already linked to an organization';
  end if;

  update public.profiles
  set first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      display_name = trim(p_first_name) || ' ' || trim(p_last_name)
  where id = v_user_id;

  insert into public.organizations (
    name, kind, contact_first_name, contact_last_name, contact_phone
  ) values (
    trim(p_name), p_kind, trim(p_first_name), trim(p_last_name), v_phone
  )
  returning id into v_org_id;

  v_role := case when p_kind = 'restaurant' then 'manager'::public.member_role
                 else 'supplier'::public.member_role end;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org_id, v_user_id, v_role);

  return v_org_id;
end;
$$;

revoke all on function public.register_organization(text,text,text,text,text) from public;
grant execute on function public.register_organization(text,text,text,text,text) to authenticated;
