import { CalendarDays, Flame } from 'lucide-react';
import type { Status } from '../../types';
import { dueLabel, formatDate, urgency } from '../../lib/dates';

/** דדליין – מודגש רק לעבודות שעדיין פתוחות */
export function DueLabel({ dueDate, status }: { dueDate: string; status: Status; compact?: boolean }) {
  const open = status === 'pending' || status === 'changes';
  const u = urgency(dueDate);
  const tone = !open ? 'text-stone-400' : u === 'overdue' ? 'text-red-700 font-medium' : u === 'today' || u === 'soon' ? 'text-amber-700 font-medium' : 'text-stone-500';
  const Icon = open && u === 'overdue' ? Flame : CalendarDays;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${tone}`} title={`דדליין: ${formatDate(dueDate)}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={1.9} />
      {open ? dueLabel(dueDate) : formatDate(dueDate)}
    </span>
  );
}
