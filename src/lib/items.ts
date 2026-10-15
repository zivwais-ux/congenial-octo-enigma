import type { Item } from '../types';

/** מועד ההחלטה האחרונה על הפריט (למאושרים – תאריך האישור) */
export function decidedAt(item: Item) {
  return [...item.events].reverse().find((e) => e.type === 'decision')?.at ?? item.createdAt;
}
