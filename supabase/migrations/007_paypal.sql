-- PayPal payment system: update escrow_payments, add payout_accounts, payout_transactions
-- Replaces Lemon Squeezy references with PayPal.

-- --------------------------------------------------
-- escrow_payments: replace Lemon Squeezy with PayPal
-- --------------------------------------------------
drop index if exists public.idx_escrow_lemonsqueezy_order;

alter table public.escrow_payments
  drop column if exists lemonsqueezy_order_id;

alter table public.escrow_payments
  add column paypal_order_id text,
  add column paypal_capture_id text;

create unique index idx_escrow_paypal_order on public.escrow_payments (paypal_order_id) where paypal_order_id is not null;

-- Ensure currency default (user requested default 'USD')
alter table public.escrow_payments alter column currency set default 'USD';

-- --------------------------------------------------
-- payout_accounts: developer PayPal email for receiving payouts
-- --------------------------------------------------
create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  paypal_email text not null,
  created_at timestamptz not null default now(),
  unique(profile_id)
);

create index idx_payout_accounts_profile on public.payout_accounts (profile_id);

alter table public.payout_accounts enable row level security;

create policy "Users can read own payout_accounts"
  on public.payout_accounts for select
  using (auth.uid() = profile_id);

create policy "Users can insert own payout_accounts"
  on public.payout_accounts for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own payout_accounts"
  on public.payout_accounts for update
  using (auth.uid() = profile_id);

-- --------------------------------------------------
-- payout_transactions: track PayPal payouts
-- --------------------------------------------------
create table if not exists public.payout_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  amount int not null,
  paypal_payout_batch_id text,
  status text not null check (
    status in (
      'pending',
      'processing',
      'paid',
      'failed'
    )
  ) default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique(milestone_id)
);

create index idx_payout_transactions_profile on public.payout_transactions (profile_id);
create index idx_payout_transactions_milestone on public.payout_transactions (milestone_id);

alter table public.payout_transactions enable row level security;

create policy "Users can read own payout_transactions"
  on public.payout_transactions for select
  using (auth.uid() = profile_id);

-- Inserts/updates for payout_transactions use service role (server-only)
