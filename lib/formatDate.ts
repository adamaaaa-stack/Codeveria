/**
 * Format dates in a deterministic way to avoid server/client hydration mismatch.
 * Does not rely on Intl or locale.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = MONTHS[d.getMonth()];
  const day = d.getDate();
  const h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${m} ${day}, ${y}, ${h12}:${min} ${ampm}`;
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = MONTHS[d.getMonth()];
  const day = d.getDate();
  return `${m} ${day}, ${y}`;
}
