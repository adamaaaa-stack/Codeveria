/**
 * Lemon Squeezy API client for creating checkouts and fetching order data.
 * Requires LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_VARIANT_ID.
 */

const API_BASE = "https://api.lemonsqueezy.com/v1";

function getConfig() {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;
  if (!apiKey || !storeId || !variantId) {
    throw new Error(
      "Missing Lemon Squeezy env: LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_VARIANT_ID"
    );
  }
  return { apiKey, storeId, variantId };
}

export interface CreateCheckoutParams {
  workspaceId: string;
  workspaceTitle: string;
  amountCents: number;
  successRedirectUrl?: string;
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
  checkoutId: string;
}

/**
 * Create a Lemon Squeezy checkout for workspace funding.
 * Uses custom_price (amount in cents). Pass workspace_id in custom_data for webhook.
 */
export async function createCheckout(
  params: CreateCheckoutParams
): Promise<CreateCheckoutResult | { error: string }> {
  const { apiKey, storeId, variantId } = getConfig();
  const body = {
    data: {
      type: "checkouts",
      attributes: {
        custom_price: params.amountCents,
        product_options: {
          name: `Workspace: ${params.workspaceTitle}`,
          description: `Fund workspace escrow for project: ${params.workspaceTitle}`,
          redirect_url: params.successRedirectUrl ?? undefined,
          enabled_variants: [parseInt(variantId, 10)],
        },
        checkout_data: {
          custom: {
            workspace_id: params.workspaceId,
          },
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: variantId },
        },
      },
    },
  };

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `Lemon Squeezy API error: ${res.status} ${text}` };
  }

  const json = (await res.json()) as {
    data?: {
      id?: string;
      attributes?: { url?: string };
    };
  };
  const id = json.data?.id;
  const url = json.data?.attributes?.url;
  if (!id || !url) {
    return { error: "Invalid checkout response: missing id or url" };
  }

  return { checkoutUrl: url, checkoutId: id };
}

export interface OrderPayload {
  id: string;
  attributes?: {
    status?: string;
    total?: number;
    currency?: string;
    identifier?: string;
    first_order_item?: { order_id?: number };
  };
}

/**
 * Fetch order by ID from Lemon Squeezy (optional; webhook usually has full payload).
 */
export async function getOrder(
  orderId: string
): Promise<{ data?: OrderPayload } | null> {
  const { apiKey } = getConfig();
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
}
