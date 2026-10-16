import type { BrandCheck } from '../types';

/** צ'קליסט המותג שהמאשר עובר לפני אישור */
export const BRAND_CHECKS: { id: BrandCheck; label: string; short: string }[] = [
  { id: 'logo', label: 'לוגו ומיקום תקינים', short: 'לוגו' },
  { id: 'colors', label: 'צבעי המותג', short: 'צבעים' },
  { id: 'proofing', label: 'הגהה ואיות', short: 'הגהה' },
  { id: 'size', label: 'מידות וגודל לפי הדרישה', short: 'מידות' },
];

export const checksLabel = (checks: BrandCheck[]) =>
  BRAND_CHECKS.filter((c) => checks.includes(c.id))
    .map((c) => c.short)
    .join(' · ');
