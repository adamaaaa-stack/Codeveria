import crypto from "node:crypto";

const SIGNING_HEADER = "x-signature";

/**
 * Verify Lemon Squeezy webhook signature (HMAC SHA-256 of raw body).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  signingSecret: string
): boolean {
  if (!signature || !rawBody) return false;
  const hmac = crypto.createHmac("sha256", signingSecret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(digest, "utf8"));
  } catch {
    return false;
  }
}

export interface WebhookMeta {
  event_name: string;
  custom_data?: Record<string, unknown>;
}

export interface WebhookOrderAttributes {
  status?: string;
  total?: number;
  currency?: string;
  identifier?: string;
  first_order_item?: { order_id?: number };
}

export interface WebhookOrderPayload {
  data?: {
    id?: string;
    type?: string;
    attributes?: WebhookOrderAttributes;
  };
  meta?: WebhookMeta;
}

/**
 * Parse webhook body and return event name + payload.
 */
export function parseWebhookPayload(body: string): {
  eventName: string | null;
  customData: Record<string, unknown>;
  orderId: string | null;
  orderStatus: string | null;
  total: number;
  currency: string;
} {
  let data: WebhookOrderPayload;
  try {
    data = JSON.parse(body) as WebhookOrderPayload;
  } catch {
    return {
      eventName: null,
      customData: {},
      orderId: null,
      orderStatus: null,
      total: 0,
      currency: "usd",
    };
  }
  const eventName = data.meta?.event_name ?? null;
  const customData = (data.meta?.custom_data as Record<string, unknown>) ?? {};
  const attrs = data.data?.attributes;
  const orderId = data.data?.id ?? null;
  return {
    eventName,
    customData,
    orderId: orderId ?? null,
    orderStatus: attrs?.status ?? null,
    total: typeof attrs?.total === "number" ? attrs.total : 0,
    currency: (attrs?.currency ?? "usd").toString().toLowerCase(),
  };
}
