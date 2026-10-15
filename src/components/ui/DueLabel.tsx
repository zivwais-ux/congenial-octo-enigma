import { CalendarClock } from 'lucide-react';
import type { Status } from '../../types';
import { dueLabel, formatDate, urgency } from '../../lib/dates';

/** דדליין – מודגש רק לפריטים שעדיין פתוחים */
export function DueLabel({ dueDate, status }: { dueDate: string; status: Status }) {
  const open = status === 'pending' || status === 'changes';
  const u = urgency(dueDate);
  const tone = !open
    ? 'text-slate-400'
    : u === 'overdue'
      ? 'font-semibold text-rose-600'
      : u === 'today' || u === 'soon'
        ? 'font-medium text-amber-700'
        : 'text-slate-500';
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${tone}`} title={formatDate(dueDate)}>
      <CalendarClock className="h-3.5 w-3.5" />
      {open ? dueLabel(dueDate) : formatDate(dueDate)}
    </span>
  );
}
