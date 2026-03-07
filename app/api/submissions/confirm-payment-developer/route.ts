import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { confirmPaymentDeveloper } from "@/lib/escrow/submissions";

/**
 * POST /api/submissions/confirm-payment-developer
 * Body: { submission_id }
 * Developer confirms they have received payment externally. Sets developer_payment_confirmed.
 * Code unlocks when both company and developer have confirmed.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const submission_id = typeof body.submission_id === "string" ? body.submission_id.trim() : "";
    if (!submission_id) return NextResponse.json({ error: "submission_id is required" }, { status: 400 });

    const result = await confirmPaymentDeveloper(submission_id, user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Confirmation failed" },
      { status: 500 }
    );
  }
}
