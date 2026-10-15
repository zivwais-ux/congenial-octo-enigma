import type { Status } from '../../types';
import { dueLabel, formatDate, urgency } from '../../lib/dates';

/** דדליין – מודגש רק לעבודות שעדיין פתוחות */
export function DueLabel({ dueDate, status }: { dueDate: string; status: Status; compact?: boolean }) {
  const open = status === 'pending' || status === 'changes';
  const u = urgency(dueDate);
  const tone = !open ? 'text-stone-400' : u === 'overdue' ? 'text-red-700 font-medium' : u === 'today' || u === 'soon' ? 'text-amber-700 font-medium' : 'text-stone-500';
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${tone}`} title={`דדליין: ${formatDate(dueDate)}`}>
      {open && u === 'overdue' && <span className="h-1.5 w-1.5 rounded-full bg-red-600" />}
      {open ? dueLabel(dueDate) : formatDate(dueDate)}
    </span>
  );
}
