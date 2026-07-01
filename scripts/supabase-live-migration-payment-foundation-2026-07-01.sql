create extension if not exists pgcrypto;

do $$
begin
  create type public.payment_status as enum (
    'pending',
    'awaiting_payment',
    'paid',
    'failed',
    'refunded',
    'disputed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_status as enum (
    'free',
    'active',
    'past_due',
    'cancelled',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.settlement_status as enum (
    'not_due',
    'pending',
    'paid',
    'held',
    'disputed'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.platform_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payment_type text not null check (
    payment_type in (
      'premium_subscription',
      'advert',
      'client_legal_work',
      'featured_listing',
      'invoice_business'
    )
  ),
  payer_name text,
  payer_email text,
  lawyer_profile_id uuid,
  related_item_id uuid,
  provider text not null default 'pending',
  provider_reference text unique,
  amount_kobo integer not null default 0 check (amount_kobo >= 0),
  currency text not null default 'NGN',
  status public.payment_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lawyer_profile_id uuid,
  account_email text,
  plan_code text not null check (plan_code in ('monthly', 'yearly')),
  payment_id uuid references public.platform_payments(id) on delete set null,
  starts_at timestamptz,
  expires_at timestamptz,
  status public.subscription_status not null default 'free',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.advert_payment_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization text,
  contact_email text,
  advert_duration text not null check (advert_duration in ('daily', 'weekly', 'monthly', 'custom')),
  quoted_amount_kobo integer not null default 0 check (quoted_amount_kobo >= 0),
  status public.payment_status not null default 'pending',
  payment_id uuid references public.platform_payments(id) on delete set null,
  admin_note text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.lawyer_work_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_name text,
  client_email text,
  client_phone text,
  lawyer_profile_id uuid,
  lawyer_name text,
  work_type text,
  work_description text,
  client_budget_kobo integer check (client_budget_kobo is null or client_budget_kobo >= 0),
  status text not null default 'requested' check (
    status in (
      'requested',
      'quoted',
      'awaiting_payment',
      'paid',
      'in_progress',
      'completed',
      'disputed',
      'cancelled'
    )
  ),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.lawyer_work_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  work_request_id uuid references public.lawyer_work_requests(id) on delete cascade,
  lawyer_profile_id uuid,
  lawyer_name text,
  quote_amount_kobo integer not null check (quote_amount_kobo >= 0),
  platform_commission_rate numeric(5,2) not null default 5.00,
  platform_commission_kobo integer not null default 0 check (platform_commission_kobo >= 0),
  lawyer_settlement_kobo integer not null default 0 check (lawyer_settlement_kobo >= 0),
  status public.payment_status not null default 'awaiting_payment',
  payment_id uuid references public.platform_payments(id) on delete set null,
  settlement_status public.settlement_status not null default 'not_due',
  terms text,
  metadata jsonb not null default '{}'::jsonb
);

create or replace function public.calculate_lawyer_work_quote_amounts()
returns trigger
language plpgsql
as $$
begin
  new.platform_commission_kobo = ceiling(new.quote_amount_kobo * (new.platform_commission_rate / 100.0));
  new.lawyer_settlement_kobo = greatest(new.quote_amount_kobo - new.platform_commission_kobo, 0);
  return new;
end;
$$;

create table if not exists public.platform_commissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  payment_id uuid references public.platform_payments(id) on delete set null,
  quote_id uuid references public.lawyer_work_quotes(id) on delete set null,
  commission_rate numeric(5,2) not null default 5.00,
  commission_amount_kobo integer not null check (commission_amount_kobo >= 0),
  status text not null default 'earned' check (status in ('earned', 'refunded', 'disputed')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists platform_payments_status_idx on public.platform_payments(status);
create index if not exists platform_payments_type_idx on public.platform_payments(payment_type);
create index if not exists platform_payments_created_at_idx on public.platform_payments(created_at desc);
create index if not exists premium_subscriptions_email_idx on public.premium_subscriptions(account_email);
create index if not exists premium_subscriptions_lawyer_idx on public.premium_subscriptions(lawyer_profile_id);
create index if not exists advert_payment_requests_status_idx on public.advert_payment_requests(status);
create index if not exists lawyer_work_requests_lawyer_idx on public.lawyer_work_requests(lawyer_profile_id);
create index if not exists lawyer_work_requests_status_idx on public.lawyer_work_requests(status);
create index if not exists lawyer_work_quotes_request_idx on public.lawyer_work_quotes(work_request_id);
create index if not exists lawyer_work_quotes_settlement_idx on public.lawyer_work_quotes(settlement_status);
create index if not exists platform_commissions_status_idx on public.platform_commissions(status);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_platform_payments_updated_at') then
    create trigger set_platform_payments_updated_at
      before update on public.platform_payments
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_premium_subscriptions_updated_at') then
    create trigger set_premium_subscriptions_updated_at
      before update on public.premium_subscriptions
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_advert_payment_requests_updated_at') then
    create trigger set_advert_payment_requests_updated_at
      before update on public.advert_payment_requests
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_lawyer_work_requests_updated_at') then
    create trigger set_lawyer_work_requests_updated_at
      before update on public.lawyer_work_requests
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_lawyer_work_quotes_updated_at') then
    create trigger set_lawyer_work_quotes_updated_at
      before update on public.lawyer_work_quotes
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'calculate_lawyer_work_quote_amounts_trigger') then
    create trigger calculate_lawyer_work_quote_amounts_trigger
      before insert or update of quote_amount_kobo, platform_commission_rate
      on public.lawyer_work_quotes
      for each row execute function public.calculate_lawyer_work_quote_amounts();
  end if;
end $$;

alter table public.platform_payments enable row level security;
alter table public.premium_subscriptions enable row level security;
alter table public.advert_payment_requests enable row level security;
alter table public.lawyer_work_requests enable row level security;
alter table public.lawyer_work_quotes enable row level security;
alter table public.platform_commissions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lawyer_work_requests' and policyname = 'public work request insert'
  ) then
    create policy "public work request insert" on public.lawyer_work_requests
      for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'advert_payment_requests' and policyname = 'public advert payment request insert'
  ) then
    create policy "public advert payment request insert" on public.advert_payment_requests
      for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'platform_payments' and policyname = 'admin payment access'
  ) then
    create policy "admin payment access" on public.platform_payments
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'premium_subscriptions' and policyname = 'admin subscription access'
  ) then
    create policy "admin subscription access" on public.premium_subscriptions
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'advert_payment_requests' and policyname = 'admin advert payment access'
  ) then
    create policy "admin advert payment access" on public.advert_payment_requests
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lawyer_work_requests' and policyname = 'admin work request access'
  ) then
    create policy "admin work request access" on public.lawyer_work_requests
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lawyer_work_quotes' and policyname = 'admin work quote access'
  ) then
    create policy "admin work quote access" on public.lawyer_work_quotes
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'platform_commissions' and policyname = 'admin commission access'
  ) then
    create policy "admin commission access" on public.platform_commissions
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

grant insert on public.lawyer_work_requests to anon, authenticated;
grant insert on public.advert_payment_requests to anon, authenticated;
grant select, insert, update, delete on public.platform_payments to authenticated;
grant select, insert, update, delete on public.premium_subscriptions to authenticated;
grant select, insert, update, delete on public.advert_payment_requests to authenticated;
grant select, insert, update, delete on public.lawyer_work_requests to authenticated;
grant select, insert, update, delete on public.lawyer_work_quotes to authenticated;
grant select, insert, update, delete on public.platform_commissions to authenticated;

select
  'learnedcircle_payment_foundation_2026_07_01_applied' as migration,
  now() as applied_at;
