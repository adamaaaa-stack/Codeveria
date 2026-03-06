import { createServiceRoleClient } from "@/lib/supabase/service";

export type AccountOwnerType = "workspace" | "profile" | "external";
export type AccountType = "escrow" | "external" | "wallet";

export interface Account {
  id: string;
  owner_type: string;
  owner_id: string | null;
  account_type: string;
  currency: string;
  created_at: string;
}

export interface LedgerTransactionRow {
  id: string;
  type: string;
  amount: number;
  currency: string;
  source_account_id: string | null;
  destination_account_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

/**
 * Create a new ledger account.
 * Use service role when calling from webhook; otherwise ensure caller has permission.
 */
export async function createAccount(params: {
  owner_type: AccountOwnerType;
  owner_id: string | null;
  account_type: AccountType;
  currency?: string;
  supabase?: ReturnType<typeof createServiceRoleClient>;
}): Promise<Account | null> {
  const supabase = params.supabase ?? createServiceRoleClient();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      owner_type: params.owner_type,
      owner_id: params.owner_id,
      account_type: params.account_type,
      currency: params.currency ?? "usd",
    })
    .select("*")
    .single();
  if (error) return null;
  return data as Account;
}

/**
 * Get or create an account by owner. Returns existing account if one exists for owner_type + owner_id + account_type + currency.
 */
export async function getOrCreateAccount(params: {
  owner_type: AccountOwnerType;
  owner_id: string | null;
  account_type: AccountType;
  currency?: string;
  supabase?: ReturnType<typeof createServiceRoleClient>;
}): Promise<Account | null> {
  const supabase = params.supabase ?? createServiceRoleClient();
  const currency = params.currency ?? "usd";
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("owner_type", params.owner_type)
    .eq("account_type", params.account_type)
    .eq("currency", currency);
  if (params.owner_id == null) {
    query = query.is("owner_id", null);
  } else {
    query = query.eq("owner_id", params.owner_id);
  }
  const { data: existing } = await query.limit(1).maybeSingle();
  if (existing) return existing as Account;
  return createAccount({ ...params, currency, supabase });
}

/**
 * Create a ledger transaction (double-entry: source -> destination).
 * Amount in cents (integer).
 */
export async function createLedgerTransaction(params: {
  type: string;
  amount: number;
  currency: string;
  source_account_id: string | null;
  destination_account_id: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  supabase?: ReturnType<typeof createServiceRoleClient>;
}): Promise<LedgerTransactionRow | null> {
  const supabase = params.supabase ?? createServiceRoleClient();
  const { data, error } = await supabase
    .from("ledger_transactions")
    .insert({
      type: params.type,
      amount: params.amount,
      currency: params.currency,
      source_account_id: params.source_account_id,
      destination_account_id: params.destination_account_id,
      reference_type: params.reference_type ?? null,
      reference_id: params.reference_id ?? null,
    })
    .select("*")
    .single();
  if (error) return null;
  return data as LedgerTransactionRow;
}

/**
 * Get account balance: sum of amounts where account is destination minus sum where account is source.
 * Amounts in cents.
 */
export async function getAccountBalance(
  accountId: string,
  supabase?: ReturnType<typeof createServiceRoleClient>
): Promise<number> {
  const client = supabase ?? createServiceRoleClient();
  const [incoming, outgoing] = await Promise.all([
    client
      .from("ledger_transactions")
      .select("amount")
      .eq("destination_account_id", accountId),
    client
      .from("ledger_transactions")
      .select("amount")
      .eq("source_account_id", accountId),
  ]);
  const credit = (incoming.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const debit = (outgoing.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  return credit - debit;
}
