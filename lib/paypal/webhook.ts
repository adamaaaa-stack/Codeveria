/**
 * PayPal webhook signature verification and event parsing.
 */

const DEFAULT_BASE = "https://api-m.sandbox.paypal.com";

export async function verifyWebhookSignature(
  rawBody: string,
  headers: {
    "paypal-auth-algo"?: string | null;
    "paypal-cert-url"?: string | null;
    "paypal-transmission-id"?: string | null;
    "paypal-transmission-sig"?: string | null;
    "paypal-transmission-time"?: string | null;
  }
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const base = process.env.PAYPAL_API_BASE ?? DEFAULT_BASE;
  if (!webhookId) return false;
  const authAlgo = headers["paypal-auth-algo"];
  const certUrl = headers["paypal-cert-url"];
  const transmissionId = headers["paypal-transmission-id"];
  const transmissionSig = headers["paypal-transmission-sig"];
  const transmissionTime = headers["paypal-transmission-time"];
  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return false;
  }
  const token = await import("./client").then((m) => m.getAccessToken());
  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export interface PayPalWebhookEvent {
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: { currency_code?: string; value?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}

export function parseWebhookBody(body: string): PayPalWebhookEvent | null {
  try {
    return JSON.parse(body) as PayPalWebhookEvent;
  } catch {
    return null;
  }
}
