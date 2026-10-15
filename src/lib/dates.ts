const DAY = 24 * 3600_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** dueDate בפורמט YYYY-MM-DD → מספר ימים מהיום (שלילי = באיחור) */
export function daysUntil(dueDate: string) {
  const [y, m, d] = dueDate.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - startOfDay(new Date())) / DAY);
}

export type Urgency = 'overdue' | 'today' | 'soon' | 'normal';

export function urgency(dueDate: string): Urgency {
  const n = daysUntil(dueDate);
  if (n < 0) return 'overdue';
  if (n === 0) return 'today';
  if (n <= 2) return 'soon';
  return 'normal';
}

export function dueLabel(dueDate: string) {
  const n = daysUntil(dueDate);
  if (n === -2) return 'באיחור של יומיים';
  if (n < -1) return `באיחור של ${-n} ימים`;
  if (n === -1) return 'באיחור של יום';
  if (n === 0) return 'היום';
  if (n === 1) return 'מחר';
  if (n === 2) return 'מחרתיים';
  return `בעוד ${n} ימים`;
}

export function formatDate(iso: string) {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'עכשיו';
  if (min < 60) return min === 1 ? 'לפני דקה' : `לפני ${min} דקות`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? 'לפני שעה' : h === 2 ? 'לפני שעתיים' : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  if (d === 1) return 'אתמול';
  if (d === 2) return 'לפני יומיים';
  if (d < 7) return `לפני ${d} ימים`;
  return formatDate(iso);
}
