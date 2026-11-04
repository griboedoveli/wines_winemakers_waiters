-- WWW MVP payout model:
-- One restaurant manager account receives the full supplier-funded bonus.
-- WWW's 10% commission is deducted only when that manager requests a payout.
-- No separate restaurant commission invoice or charge is created.

alter table public.platform_fee_ledger
  alter column sale_id drop not null;

-- Stop accruing platform fees when a sale is approved. The legacy table is retained
-- for historical compatibility; new withdrawal fees are snapshotted per payout.
create or replace function public.manager_review_sale(p_sale_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_supplier_id uuid;
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

  update public.sales
    set status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        waiter_user_id = auth.uid()
    where id = p_sale_id;

  -- MVP: the single manager account is the bonus recipient.
  insert into public.bonus_ledger
    (sale_id, waiter_user_id, supplier_organization_id, amount, entry_type)
  values
    (p_sale_id, auth.uid(), v_supplier_id, v_sale.bonus_amount, 'earned');
end;
$$;

-- Each payout request reserves a gross amount from the manager's available bonus balance.
create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  gross_amount numeric(12,2) not null check (gross_amount > 0),
  fee_percent_snapshot numeric(5,2) not null default 10.00 check (fee_percent_snapshot >= 0 and fee_percent_snapshot <= 100),
  fee_amount numeric(12,2) not null check (fee_amount >= 0),
  net_amount numeric(12,2) not null check (net_amount >= 0),
  status text not null default 'pending' check (status in ('pending','paid','rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  admin_note text
);

create index payout_requests_user_status_idx on public.payout_requests(user_id,status,requested_at desc);

alter table public.payout_requests enable row level security;

create policy "managers view own payout requests"
on public.payout_requests for select to authenticated
using (user_id = auth.uid());

create policy "platform admins view all payout requests"
on public.payout_requests for select to authenticated
using (public.is_platform_admin());

grant select on table public.payout_requests to authenticated;

-- A manager can request a payout only for the balance credited to their own account.
-- Pending requests reserve funds; rejected requests release them; paid requests consume them.
create or replace function public.request_manager_payout(p_gross_amount numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_available numeric(12,2);
  v_reserved numeric(12,2);
  v_fee_percent numeric(5,2) := 10.00;
  v_fee numeric(12,2);
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = v_user_id
      and m.role = 'manager'
      and o.kind = 'restaurant'
  ) then
    raise exception 'Only a restaurant manager can request a payout';
  end if;

  if p_gross_amount is null or p_gross_amount <= 0 then
    raise exception 'Payout amount must be greater than zero';
  end if;

  -- Serialize payout requests for this account to prevent double reservation.
  perform 1 from public.profiles where id = v_user_id for update;

  select coalesce(sum(
    case
      when entry_type = 'earned' then amount
      when entry_type = 'reversed' then -amount
      else 0
    end
  ), 0)
  into v_available
  from public.bonus_ledger
  where waiter_user_id = v_user_id;

  select coalesce(sum(gross_amount), 0)
  into v_reserved
  from public.payout_requests
  where user_id = v_user_id
    and status in ('pending','paid');

  v_available := v_available - v_reserved;

  if p_gross_amount > v_available then
    raise exception 'Insufficient available balance. Available: %', greatest(v_available, 0);
  end if;

  v_fee := round(p_gross_amount * v_fee_percent / 100.0, 2);

  insert into public.payout_requests
    (user_id, gross_amount, fee_percent_snapshot, fee_amount, net_amount)
  values
    (v_user_id, round(p_gross_amount, 2), v_fee_percent, v_fee, round(p_gross_amount, 2) - v_fee)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- Only WWW admins can finalize manual bank transfers or reject requests.
create or replace function public.admin_review_payout(
  p_request_id uuid,
  p_mark_paid boolean,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.payout_requests%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'Only a WWW administrator can review payouts';
  end if;

  select * into v_request
  from public.payout_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Payout request not found';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending payout requests can be reviewed';
  end if;

  update public.payout_requests
  set status = case when p_mark_paid then 'paid' else 'rejected' end,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      admin_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_request_id;
end;
$$;

revoke all on function public.request_manager_payout(numeric) from public;
revoke all on function public.admin_review_payout(uuid, boolean, text) from public;
grant execute on function public.request_manager_payout(numeric) to authenticated;
grant execute on function public.admin_review_payout(uuid, boolean, text) to authenticated;

comment on table public.payout_requests is
  'Manual MVP payout requests. WWW commission is deducted from the manager gross balance only when a payout is requested; no separate restaurant fee is charged.';
