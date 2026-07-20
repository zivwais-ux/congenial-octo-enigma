/** Formatting helpers for currency, cost bands and relative time. */

const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: '฿',
  VND: '₫',
  USD: '$',
  MMK: 'K',
  EUR: '€',
  INR: '₹',
  MXN: 'MX$',
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}

/** e.g. formatCost(60, "THB") -> "฿60" ; formatCost(45000, "VND") -> "₫45,000" */
export function formatCost(amount: number, currency: string): string {
  const symbol = currencySymbol(currency);
  const rounded = Math.round(amount);
  const grouped = rounded.toLocaleString('en-US');
  return `${symbol}${grouped}`;
}

/**
 * Coarse affordability band shown as $ / $$ / $$$ using rough USD thresholds.
 * Amounts are converted with approximate rates purely for display bucketing.
 */
const APPROX_USD_RATE: Record<string, number> = {
  THB: 0.028,
  VND: 0.00004,
  USD: 1,
  MMK: 0.00048,
  EUR: 1.08,
  INR: 0.012,
  MXN: 0.058,
};

export function costBand(amount: number, currency: string): '$' | '$$' | '$$$' {
  const usd = amount * (APPROX_USD_RATE[currency] ?? 1);
  if (usd <= 3) return '$';
  if (usd <= 10) return '$$';
  return '$$$';
}

/** e.g. "just now", "3h ago", "2d ago", "Mar 4". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks}w ago`;
  return new Date(then).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Compact like/count formatting: 1200 -> "1.2k". */
export function compactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 10000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  if (value < 1_000_000) return `${Math.round(value / 1000)}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
}
