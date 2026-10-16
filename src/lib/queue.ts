// תור הסקירה של מאשר: העבודות שמחכות להחלטה שלו, הדחוף ראשון
import type { AppState, Item } from '../types';

export const byDue = (a: Item, b: Item) => a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt);

export function approverQueue(state: AppState, userId: string): Item[] {
  return state.items.filter((i) => i.approverId === userId && i.status === 'pending').sort(byDue);
}
