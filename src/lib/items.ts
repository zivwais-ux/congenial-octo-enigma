import type { Item } from '../types';

/** מועד ההחלטה האחרונה על הפריט (למאושרים – תאריך האישור) */
export function decidedAt(item: Item) {
  return [...item.events].reverse().find((e) => e.type === 'decision')?.at ?? item.createdAt;
}

const DAY = 24 * 3600_000;

/** תמונת מצב ללוח: זמן אישור ממוצע, סבבים לעבודה, והעבודה שמחכה הכי הרבה */
export function boardInsights(items: Item[], now = Date.now()) {
  const approved = items.filter((i) => i.status === 'approved');
  const avgDays = approved.length ? approved.reduce((n, i) => n + (Date.parse(decidedAt(i)) - Date.parse(i.createdAt)) / DAY, 0) / approved.length : null;
  const decided = items.filter((i) => i.status !== 'pending' || i.versions.length > 1);
  const avgRounds = decided.length ? decided.reduce((n, i) => n + i.versions.length, 0) / decided.length : null;
  const waiting = items
    .filter((i) => i.status === 'pending')
    .map((item) => ({ item, days: (now - Date.parse(item.versions[item.versions.length - 1].uploadedAt)) / DAY }))
    .sort((a, b) => b.days - a.days);
  return { avgDays, avgRounds, longest: waiting[0] };
}
