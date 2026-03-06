import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createCheckout } from "@/lib/lemonsqueezy/client";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const workspaceId = body?.workspace_id;
    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id, company_id, total_budget, title, status")
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

    const amountCents = Number(workspace.total_budget);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: "Invalid workspace budget" }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (typeof request.url === "string" ? new URL(request.url).origin : "");
    const result = await createCheckout({
      workspaceId,
      workspaceTitle: workspace.title ?? "Workspace",
      amountCents,
      successRedirectUrl: `${baseUrl}/workspace/${workspaceId}`,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      checkout_url: result.checkoutUrl,
    });
  } catch (e) {
    console.error("[create-checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
