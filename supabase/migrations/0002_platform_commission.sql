-- WWW platform commission: 10% of the waiter bonus, paid by the restaurant.
-- The commission is recorded only when a manager approves a sale.
create table public.restaurant_fee_settings (
  restaurant_organization_id uuid primary key references public.organizations(id) on delete cascade,
  fee_percent numeric(5,2) not null default 10.00 check (fee_percent >= 0 and fee_percent <= 100),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.platform_fee_ledger (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null unique references public.sales(id),
  restaurant_organization_id uuid not null references public.organizations(id),
  waiter_bonus_amount numeric(10,2) not null check (waiter_bonus_amount >= 0),
  fee_percent_snapshot numeric(5,2) not null check (fee_percent_snapshot >= 0 and fee_percent_snapshot <= 100),
  fee_amount numeric(10,2) not null check (fee_amount >= 0),
  status text not null default 'accrued' check (status in ('accrued','paid','void')),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create index platform_fee_ledger_restaurant_idx on public.platform_fee_ledger(restaurant_organization_id,status);
create index platform_fee_ledger_created_idx on public.platform_fee_ledger(created_at desc);

alter table public.restaurant_fee_settings enable row level security;
alter table public.platform_admins enable row level security;
alter table public.platform_fee_ledger enable row level security;

create policy "restaurant managers view fee settings"
on public.restaurant_fee_settings for select to authenticated
using (public.is_org_member(restaurant_organization_id, array['manager']::public.member_role[]));

create policy "restaurant managers update fee settings"
on public.restaurant_fee_settings for all to authenticated
using (public.is_org_member(restaurant_organization_id, array['manager']::public.member_role[]))
with check (public.is_org_member(restaurant_organization_id, array['manager']::public.member_role[]));

create policy "platform admins view platform fee ledger"
on public.platform_fee_ledger for select to authenticated
using (exists (select 1 from public.platform_admins a where a.user_id = auth.uid()));

create policy "platform admins view platform admin list"
on public.platform_admins for select to authenticated
using (user_id = auth.uid());

-- Approval and both ledger entries are one database transaction.
-- A waiter always receives the full bonus; the restaurant's fee is recorded separately.
create or replace function public.manager_review_sale(p_sale_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_supplier_id uuid;
  v_fee_percent numeric(5,2);
  v_fee_amount numeric(10,2);
begin
  select * into v_sale
  from public.sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'Sale not found';
  end if;

  if not public.is_org_member(v_sale.restaurant_organization_id, array['manager']::public.member_role[]) then
    raise exception 'Only a manager of this restaurant can review the sale';
  end if;

  if v_sale.status <> 'pending' then
    raise exception 'Only pending sales can be reviewed';
  end if;

  if not p_approve then
    update public.sales
      set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
      where id = p_sale_id;
    return;
  end if;

  select supplier_organization_id into v_supplier_id
  from public.wine_offers where id = v_sale.wine_offer_id;

  select fee_percent into v_fee_percent
  from public.restaurant_fee_settings
  where restaurant_organization_id = v_sale.restaurant_organization_id;

  v_fee_percent := coalesce(v_fee_percent, 10.00);
  v_fee_amount := round(v_sale.bonus_amount * v_fee_percent / 100.0, 2);

  update public.sales
    set status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = now()
    where id = p_sale_id;

  insert into public.bonus_ledger
    (sale_id, waiter_user_id, supplier_organization_id, amount, entry_type)
  values
    (p_sale_id, v_sale.waiter_user_id, v_supplier_id, v_sale.bonus_amount, 'earned');

  insert into public.platform_fee_ledger
    (sale_id, restaurant_organization_id, waiter_bonus_amount, fee_percent_snapshot, fee_amount)
  values
    (p_sale_id, v_sale.restaurant_organization_id, v_sale.bonus_amount, v_fee_percent, v_fee_amount);
end;
$$;

-- Remove direct manager updates: all reviews must go through the atomic function above.
drop policy if exists "managers review sales" on public.sales;
revoke update on public.sales from authenticated;
grant execute on function public.manager_review_sale(uuid, boolean) to authenticated;

-- Add the developer's auth user to platform_admins manually after account creation:
-- insert into public.platform_admins(user_id) values ('YOUR-AUTH-USER-UUID');
