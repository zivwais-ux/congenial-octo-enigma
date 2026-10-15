import { CalendarClock, Flame } from 'lucide-react';
import type { Status } from '../../types';
import { dueLabel, formatDate, urgency } from '../../lib/dates';

/** דדליין – מודגש רק לעבודות שעדיין פתוחות */
export function DueLabel({ dueDate, status, compact }: { dueDate: string; status: Status; compact?: boolean }) {
  const open = status === 'pending' || status === 'changes';
  const u = urgency(dueDate);
  const tone = !open
    ? 'text-zinc-400'
    : u === 'overdue'
      ? 'font-semibold text-rose-600'
      : u === 'today' || u === 'soon'
        ? 'font-semibold text-amber-700'
        : 'text-zinc-500';
  const Icon = open && u === 'overdue' ? Flame : CalendarClock;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-xs ${tone}`} title={`דדליין: ${formatDate(dueDate)}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {open ? dueLabel(dueDate) : compact ? formatDate(dueDate) : `דדליין ${formatDate(dueDate)}`}
    </span>
  );
}
