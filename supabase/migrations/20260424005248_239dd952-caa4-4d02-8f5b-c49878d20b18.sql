
-- ===== ROLES =====
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users see own roles" on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ===== ACCOUNTS =====
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  account_number text not null unique,
  currency text not null default 'USD',
  balance numeric(18,2) not null default 0,
  frozen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "users view own account" on public.accounts for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admins update accounts" on public.accounts for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins insert accounts" on public.accounts for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== TRANSACTIONS =====
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('deposit','withdrawal','transfer_out','transfer_in','fx','loan_disbursement','loan_repayment','fee','adjustment','bill_payment')),
  status text not null default 'completed' check (status in ('pending','completed','failed','rejected','awaiting_code')),
  amount numeric(18,2) not null,
  currency text not null default 'USD',
  fx_rate numeric(18,6),
  converted_amount numeric(18,2),
  converted_currency text,
  recipient_name text,
  recipient_account text,
  recipient_bank text,
  recipient_country text,
  description text,
  reference text not null default ('TX-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

create policy "users view own tx" on public.transactions for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "users insert own tx" on public.transactions for insert to authenticated
  with check (auth.uid() = user_id);
create policy "admins update tx" on public.transactions for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admins insert tx" on public.transactions for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

-- ===== LOANS =====
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(18,2) not null,
  currency text not null default 'USD',
  term_months int not null,
  interest_rate numeric(5,2) not null default 8.5,
  purpose text,
  status text not null default 'pending' check (status in ('pending','approved','active','rejected','paid','awaiting_code')),
  rejection_reason text,
  approved_at timestamptz,
  disbursed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.loans (user_id, created_at desc);

alter table public.loans enable row level security;

create policy "users view own loans" on public.loans for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "users insert own loans" on public.loans for insert to authenticated
  with check (auth.uid() = user_id);
create policy "admins update loans" on public.loans for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ===== CARDS =====
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  card_number text not null,
  card_type text not null default 'virtual' check (card_type in ('virtual','physical')),
  brand text not null default 'Visa',
  cvv text not null,
  expires_at text not null,
  cardholder_name text not null,
  monthly_limit numeric(18,2) not null default 5000,
  frozen boolean not null default false,
  online_enabled boolean not null default true,
  atm_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cards enable row level security;

create policy "users view own cards" on public.cards for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "users update own cards" on public.cards for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users insert own cards" on public.cards for insert to authenticated
  with check (auth.uid() = user_id);

-- ===== AUTH CODES (COT + LOAN) =====
create table public.auth_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  code text not null,
  code_type text not null check (code_type in ('cot','loan','imf','tax')),
  loan_id uuid references public.loans(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete set null,
  used boolean not null default false,
  used_at timestamptz,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index on public.auth_codes (user_id, code_type, used);

alter table public.auth_codes enable row level security;

create policy "users view own codes" on public.auth_codes for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "users update own codes" on public.auth_codes for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admins manage codes" on public.auth_codes for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- ===== BENEFICIARIES =====
create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  account_number text not null,
  bank_name text,
  swift_code text,
  country text,
  currency text default 'USD',
  created_at timestamptz not null default now()
);

alter table public.beneficiaries enable row level security;

create policy "users manage own beneficiaries" on public.beneficiaries for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===== FX RATES =====
create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null default 'USD',
  quote_currency text not null,
  rate numeric(18,6) not null,
  updated_at timestamptz not null default now(),
  unique (base_currency, quote_currency)
);

alter table public.fx_rates enable row level security;
create policy "anyone reads fx" on public.fx_rates for select to authenticated using (true);
create policy "admins manage fx" on public.fx_rates for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Seed common rates
insert into public.fx_rates (base_currency, quote_currency, rate) values
  ('USD','EUR',0.92),('USD','GBP',0.79),('USD','NGN',1580),('USD','CAD',1.37),
  ('USD','AUD',1.52),('USD','JPY',155),('USD','INR',83.5),('USD','ZAR',18.5),
  ('USD','KES',129),('USD','GHS',14.5),('USD','CNY',7.24),('USD','AED',3.67),
  ('USD','CHF',0.89),('USD','MXN',17.1),('USD','BRL',5.05),('USD','SGD',1.34);

-- ===== TIMESTAMPS =====
create or replace function public.tg_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger t_accounts_upd before update on public.accounts for each row execute function public.tg_set_updated_at();
create trigger t_tx_upd before update on public.transactions for each row execute function public.tg_set_updated_at();
create trigger t_loans_upd before update on public.loans for each row execute function public.tg_set_updated_at();
create trigger t_cards_upd before update on public.cards for each row execute function public.tg_set_updated_at();

-- ===== AUTO-PROVISION ACCOUNT + DEFAULT USER ROLE + STARTER CARD =====
create or replace function public.handle_new_user_full()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_currency text := coalesce(new.raw_user_meta_data ->> 'currency', 'USD');
  v_first text := coalesce(new.raw_user_meta_data ->> 'first_name', split_part(new.email,'@',1));
  v_last text := coalesce(new.raw_user_meta_data ->> 'last_name', '');
  v_acct text := lpad((floor(random()*1e10))::bigint::text, 10, '0');
  v_card text := '4' || lpad((floor(random()*1e15))::bigint::text, 15, '0');
  v_cvv text := lpad((floor(random()*1000))::int::text, 3, '0');
begin
  -- profile (matches existing handle_new_user behavior)
  insert into public.profiles (id, email, first_name, last_name, phone, country, currency, account_type, address, city, postal_code)
  values (new.id, new.email,
    new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone', new.raw_user_meta_data ->> 'country',
    v_currency, new.raw_user_meta_data ->> 'account_type',
    new.raw_user_meta_data ->> 'address', new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'postal_code')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;

  insert into public.accounts (user_id, account_number, currency, balance)
  values (new.id, v_acct, v_currency, 0) on conflict (user_id) do nothing;

  insert into public.cards (user_id, card_number, cvv, expires_at, cardholder_name, brand)
  values (new.id, v_card, v_cvv, to_char(now() + interval '4 years', 'MM/YY'),
          upper(trim(v_first || ' ' || v_last)), 'Visa');

  return new;
end $$;

-- Replace the old trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_full();

-- Backfill for existing users
insert into public.user_roles (user_id, role)
  select id, 'user'::app_role from auth.users on conflict do nothing;

insert into public.accounts (user_id, account_number, currency, balance)
  select u.id, lpad((floor(random()*1e10))::bigint::text, 10, '0'),
         coalesce(p.currency, 'USD'), 0
  from auth.users u left join public.profiles p on p.id = u.id
  on conflict (user_id) do nothing;
