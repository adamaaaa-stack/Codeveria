-- Financial ledger: accounts, ledger_transactions, escrow_payments
-- Used for PayPal funding and escrow tracking (see 007_paypal for PayPal fields).

-- --------------------------------------------------
-- accounts
-- --------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null,
  owner_id uuid,
  account_type text not null,
  currency text not null default 'usd',
  created_at timestamptz not null default now()
);

create index idx_accounts_owner on public.accounts (owner_type, owner_id);
create index idx_accounts_type on public.accounts (account_type);

-- --------------------------------------------------
-- ledger_transactions
-- --------------------------------------------------
create table public.ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  amount int not null,
  currency text not null,
  source_account_id uuid references public.accounts(id),
  destination_account_id uuid references public.accounts(id),
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index idx_ledger_source on public.ledger_transactions (source_account_id);
create index idx_ledger_destination on public.ledger_transactions (destination_account_id);
create index idx_ledger_reference on public.ledger_transactions (reference_type, reference_id);

-- --------------------------------------------------
-- escrow_payments
-- --------------------------------------------------
create table public.escrow_payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  company_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  lemonsqueezy_order_id text,
  amount int not null,
  currency text not null default 'usd',
  status text not null check (
    status in (
      'pending',
      'funded',
      'partially_released',
      'released',
      'refunded'
    )
  ) default 'pending',
  created_at timestamptz not null default now()
);

create unique index idx_escrow_lemonsqueezy_order on public.escrow_payments (lemonsqueezy_order_id) where lemonsqueezy_order_id is not null;
create index idx_escrow_workspace on public.escrow_payments (workspace_id);

-- --------------------------------------------------
-- RLS: accounts (participants can read workspace escrow accounts; service role for writes in webhook)
-- --------------------------------------------------
alter table public.accounts enable row level security;

create policy "Users can read accounts for their workspaces or profiles"
  on public.accounts for select
  using (
    (owner_type = 'workspace' and owner_id in (
      select id from public.workspaces where company_id = auth.uid() or student_id = auth.uid()
    ))
    or (owner_type = 'external')
    or (owner_type = 'profile' and owner_id = auth.uid())
  );

-- Inserts/updates use service role in webhook (bypasses RLS).

-- --------------------------------------------------
-- RLS: ledger_transactions (read for own accounts)
-- --------------------------------------------------
alter table public.ledger_transactions enable row level security;

create policy "Users can read ledger transactions for their accounts"
  on public.ledger_transactions for select
  using (
    source_account_id in (select id from public.accounts a where (a.owner_type = 'workspace' and a.owner_id in (select id from public.workspaces w where w.company_id = auth.uid() or w.student_id = auth.uid())) or (a.owner_type = 'profile' and a.owner_id = auth.uid()) or a.owner_type = 'external')
    or destination_account_id in (select id from public.accounts a where (a.owner_type = 'workspace' and a.owner_id in (select id from public.workspaces w where w.company_id = auth.uid() or w.student_id = auth.uid())) or (a.owner_type = 'profile' and a.owner_id = auth.uid()) or a.owner_type = 'external')
  );

-- --------------------------------------------------
-- RLS: escrow_payments (workspace participants can read)
-- --------------------------------------------------
alter table public.escrow_payments enable row level security;

create policy "Workspace participants can read escrow_payments"
  on public.escrow_payments for select
  using (
    workspace_id in (select id from public.workspaces where company_id = auth.uid() or student_id = auth.uid())
  );
