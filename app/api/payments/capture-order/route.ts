import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { captureOrder } from "@/lib/paypal/client";
import { getOrCreateAccount, createLedgerTransaction } from "@/lib/ledger/client";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const orderId = body?.order_id;
    const workspaceId = body?.workspace_id;
    if (!orderId || typeof orderId !== "string" || !workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "order_id and workspace_id are required" },
        { status: 400 }
      );
    }

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id, company_id, student_id, status")
      .eq("id", workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    if (workspace.company_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (workspace.status !== "funding_required") {
      return NextResponse.json(
        { error: "Workspace is not in funding_required status" },
        { status: 400 }
      );
    }

    const captureResult = await captureOrder(orderId);
    if ("error" in captureResult) {
      return NextResponse.json({ error: captureResult.error }, { status: 502 });
    }
    if (captureResult.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Capture not completed: ${captureResult.status}` },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    const { data: existing } = await serviceSupabase
      .from("escrow_payments")
      .select("id")
      .eq("paypal_order_id", orderId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, message: "Already captured" });
    }

    const { data: escrowPayment, error: escrowErr } = await serviceSupabase
      .from("escrow_payments")
      .insert({
        workspace_id: workspaceId,
        company_id: workspace.company_id,
        student_id: workspace.student_id,
        paypal_order_id: orderId,
        paypal_capture_id: captureResult.captureId,
        amount: captureResult.amount,
        currency: (captureResult.currency ?? "USD").toLowerCase(),
        status: "funded",
      })
      .select("id")
      .single();

    if (escrowErr || !escrowPayment) {
      console.error("[capture-order] escrow_payments insert failed", escrowErr);
      return NextResponse.json({ error: "Failed to create escrow payment" }, { status: 500 });
    }

    const currencyLower = (captureResult.currency ?? "USD").toLowerCase();
    const externalAccount = await getOrCreateAccount({
      owner_type: "external",
      owner_id: null,
      account_type: "external",
      currency: currencyLower,
      supabase: serviceSupabase,
    });
    const escrowAccount = await getOrCreateAccount({
      owner_type: "workspace",
      owner_id: workspaceId,
      account_type: "escrow",
      currency: currencyLower,
      supabase: serviceSupabase,
    });

    if (!externalAccount || !escrowAccount) {
      console.error("[capture-order] failed to get or create accounts");
      return NextResponse.json({ error: "Failed to create ledger accounts" }, { status: 500 });
    }

    await createLedgerTransaction({
      type: "external_payment",
      amount: captureResult.amount,
      currency: currencyLower,
      source_account_id: externalAccount.id,
      destination_account_id: escrowAccount.id,
      reference_type: "escrow_payment",
      reference_id: escrowPayment.id,
      supabase: serviceSupabase,
    });

    const { error: updateErr } = await serviceSupabase
      .from("workspaces")
      .update({ status: "active" })
      .eq("id", workspaceId);

    if (updateErr) {
      console.error("[capture-order] failed to update workspace status", updateErr);
      return NextResponse.json({ error: "Failed to activate workspace" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[payments capture-order]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
