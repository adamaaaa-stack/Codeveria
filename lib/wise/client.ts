// Placeholder: Wise API client (to be implemented)
// Used for payouts to student developers.

export function createPayout(
  recipientId: string,
  amountCents: number,
  currency: string,
  reference: string
) {
  return Promise.resolve({ payoutId: "", status: "pending" });
}

export function getPayoutStatus(payoutId: string) {
  return Promise.resolve(null);
}
