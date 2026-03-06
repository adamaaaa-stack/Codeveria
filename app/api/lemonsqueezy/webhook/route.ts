import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
} from "@/lib/lemonsqueezy/webhooks";
import {
  getOrCreateAccount,
  createLedgerTransaction,
} from "@/lib/ledger/client";

const EVENT_ORDER_CREATED = "order_created";
const EVENT_ORDER_PAID = "order_paid";

export async function POST(request: Request) {
  const signingSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!signingSecret) {
    console.error("[lemonsqueezy webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-signature") ?? null;
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!verifyWebhookSignature(rawBody, signature, signingSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { eventName, customData, orderId, orderStatus, total, currency } =
    parseWebhookPayload(rawBody);

  if (eventName !== EVENT_ORDER_CREATED && eventName !== EVENT_ORDER_PAID) {
    return NextResponse.json({ received: true });
  }

  const workspaceId = customData?.workspace_id;
  if (!workspaceId || typeof workspaceId !== "string") {
    return NextResponse.json({ error: "Missing workspace_id in custom_data" }, { status: 400 });
  }

  if (orderStatus !== "paid") {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceRoleClient();

  const orderIdStr = orderId != null ? String(orderId) : "";
  if (!orderIdStr) {
    return NextResponse.json({ error: "Missing order id in payload" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("escrow_payments")
    .select("id")
    .eq("lemonsqueezy_order_id", orderIdStr)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  const { data: workspace, error: wsErr } = await supabase
    .from("workspaces")
    .select("id, company_id, student_id, status")
    .eq("id", workspaceId)
    .single();

  if (wsErr || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
  }
  if (workspace.status !== "funding_required") {
    return NextResponse.json({ error: "Workspace not in funding_required" }, { status: 400 });
  }

  const amountCents = Math.round(total);
  const currencyLower = currency.toLowerCase();

  const { data: escrowPayment, error: escrowErr } = await supabase
    .from("escrow_payments")
    .insert({
      workspace_id: workspaceId,
      company_id: workspace.company_id,
      student_id: workspace.student_id,
      lemonsqueezy_order_id: orderIdStr,
      amount: amountCents,
      currency: currencyLower,
      status: "funded",
    })
    .select("id")
    .single();

  if (escrowErr || !escrowPayment) {
    console.error("[lemonsqueezy webhook] escrow_payments insert failed", escrowErr);
    return NextResponse.json({ error: "Failed to create escrow payment" }, { status: 500 });
  }

  const externalAccount = await getOrCreateAccount({
    owner_type: "external",
    owner_id: null,
    account_type: "external",
    currency: currencyLower,
    supabase,
  });
  const escrowAccount = await getOrCreateAccount({
    owner_type: "workspace",
    owner_id: workspaceId,
    account_type: "escrow",
    currency: currencyLower,
    supabase,
  });

  if (!externalAccount || !escrowAccount) {
    console.error("[lemonsqueezy webhook] failed to get or create accounts");
    return NextResponse.json({ error: "Failed to create ledger accounts" }, { status: 500 });
  }

  const ledgerTx = await createLedgerTransaction({
    type: "external_payment",
    amount: amountCents,
    currency: currencyLower,
    source_account_id: externalAccount.id,
    destination_account_id: escrowAccount.id,
    reference_type: "escrow_payment",
    reference_id: escrowPayment.id,
    supabase,
  });

  if (!ledgerTx) {
    console.error("[lemonsqueezy webhook] failed to create ledger transaction");
  }

  const { error: updateErr } = await supabase
    .from("workspaces")
    .update({ status: "active" })
    .eq("id", workspaceId);

  if (updateErr) {
    console.error("[lemonsqueezy webhook] failed to update workspace status", updateErr);
    return NextResponse.json({ error: "Failed to activate workspace" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
