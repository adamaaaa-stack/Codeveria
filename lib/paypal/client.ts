/**
 * PayPal REST API client: Orders API (v2) and Payouts API (v1).
 * Env: PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_API_BASE (default sandbox).
 */

const DEFAULT_BASE = "https://api-m.sandbox.paypal.com";

function getConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const base = process.env.PAYPAL_API_BASE ?? DEFAULT_BASE;
  if (!clientId || !secret) {
    throw new Error("Missing PayPal env: PAYPAL_CLIENT_ID and PAYPAL_SECRET are required.");
  }
  return { clientId, secret, base };
}

let cachedToken: { access_token: string; expires_at: number } | null = null;

/**
 * Get OAuth2 access token (cached until near expiry).
 */
export async function getAccessToken(): Promise<string> {
  const { clientId, secret, base } = getConfig();
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + 60_000) {
    return cachedToken.access_token;
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000,
  };
  return data.access_token;
}

/**
 * Create an order (Orders API v2). Amount in cents.
 * Returns order id and approval URL for redirect.
 * returnUrl/cancelUrl: user is redirected there after approval/cancel.
 */
export async function createOrder(
  amountCents: number,
  currency: string,
  options?: { returnUrl?: string; cancelUrl?: string }
): Promise<{ orderId: string; approvalUrl: string } | { error: string }> {
  const { base } = getConfig();
  const token = await getAccessToken();
  const value = (amountCents / 100).toFixed(2);
  const currencyCode = currency.toUpperCase().slice(0, 3);
  const payload: Record<string, unknown> = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currencyCode,
          value,
        },
      },
    ],
  };
  if (options?.returnUrl || options?.cancelUrl) {
    payload.application_context = {
      return_url: options.returnUrl,
      cancel_url: options.cancelUrl,
    };
  }
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `PayPal create order error: ${res.status} ${text}` };
  }
  const order = (await res.json()) as {
    id?: string;
    status?: string;
    links?: Array<{ rel: string; href: string }>;
  };
  const orderId = order.id;
  const approveLink = order.links?.find((l) => l.rel === "approve");
  const approvalUrl = approveLink?.href;
  if (!orderId || !approvalUrl) {
    return { error: "PayPal order response missing id or approval link" };
  }
  return { orderId, approvalUrl };
}

/**
 * Capture a created order. Returns capture id and amount details.
 */
export async function captureOrder(
  orderId: string
): Promise<
  | { captureId: string; amount: number; currency: string; status: string }
  | { error: string }
> {
  const { base } = getConfig();
  const token = await getAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `PayPal capture error: ${res.status} ${text}` };
  }
  const data = (await res.json()) as {
    status?: string;
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          id?: string;
          status?: string;
          amount?: { currency_code?: string; value?: string };
        }>;
      };
    }>;
  };
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  const captureId = capture?.id;
  const status = capture?.status ?? data.status ?? "";
  const valueStr = capture?.amount?.value;
  const currency = capture?.amount?.currency_code ?? "USD";
  const amount = valueStr ? Math.round(parseFloat(valueStr) * 100) : 0;
  if (!captureId) {
    return { error: "PayPal capture response missing capture id" };
  }
  return { captureId, amount, currency: currency.toUpperCase(), status };
}

/**
 * Send a payout to a PayPal account (email). Amount in cents.
 * Returns batch_id for tracking.
 */
export async function sendPayout(
  email: string,
  amountCents: number,
  currency: string = "USD"
): Promise<{ payoutBatchId: string } | { error: string }> {
  const { base } = getConfig();
  const token = await getAccessToken();
  const value = (amountCents / 100).toFixed(2);
  const currencyCode = currency.toUpperCase().slice(0, 3);
  const res = await fetch(`${base}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `payout_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        email_subject: "You have a payout from Codeveria",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value,
            currency: currencyCode,
          },
          receiver: email,
          note: "Milestone payout",
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `PayPal payout error: ${res.status} ${text}` };
  }
  const data = (await res.json()) as { batch_header?: { payout_batch_id?: string } };
  const payoutBatchId = data.batch_header?.payout_batch_id;
  if (!payoutBatchId) {
    return { error: "PayPal payout response missing batch id" };
  }
  return { payoutBatchId };
}
