import { NextResponse } from "next/server";

/**
 * POST /api/submissions/unlock
 * Deprecated: code unlock is done via manual payment confirmation.
 * Company and developer confirm payment via /api/submissions/confirm-payment-company and confirm-payment-developer.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Payments are handled directly between the company and developer. Both parties must confirm payment before the code is released." },
    { status: 400 }
  );
}
