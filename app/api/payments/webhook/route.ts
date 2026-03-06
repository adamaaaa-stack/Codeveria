import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { verifyWebhookSignature, parseWebhookBody } from "@/lib/paypal/webhook";

const EVENT_CAPTURE_COMPLETED = "PAYMENT.CAPTURE.COMPLETED";
const EVENT_CAPTURE_DENIED = "PAYMENT.CAPTURE.DENIED";
const EVENT_CAPTURE_REFUNDED = "PAYMENT.CAPTURE.REFUNDED";

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const headers = {
    "paypal-auth-algo": request.headers.get("paypal-auth-algo"),
    "paypal-cert-url": request.headers.get("paypal-cert-url"),
    "paypal-transmission-id": request.headers.get("paypal-transmission-id"),
    "paypal-transmission-sig": request.headers.get("paypal-transmission-sig"),
    "paypal-transmission-time": request.headers.get("paypal-transmission-time"),
  };

  const valid = await verifyWebhookSignature(rawBody, headers);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = parseWebhookBody(rawBody);
  if (!event?.event_type) {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceRoleClient();
  const captureId = event.resource?.id;
  const status = event.resource?.status;

  if (event.event_type === EVENT_CAPTURE_REFUNDED && captureId) {
    await supabase
      .from("escrow_payments")
      .update({ status: "refunded" })
      .eq("paypal_capture_id", captureId);
  }

  if (event.event_type === EVENT_CAPTURE_COMPLETED && captureId) {
    const { data: existing } = await supabase
      .from("escrow_payments")
      .select("id, status")
      .eq("paypal_capture_id", captureId)
      .maybeSingle();
    if (existing && existing.status !== "funded") {
      await supabase
        .from("escrow_payments")
        .update({ status: "funded" })
        .eq("id", existing.id);
    }
  }

  return NextResponse.json({ received: true });
}
