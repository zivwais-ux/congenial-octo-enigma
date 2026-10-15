import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { Item } from '../../types';
import { useLookups, useStore } from '../../store/StoreProvider';
import { urgency } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import { DueLabel } from '../ui/DueLabel';
import { FileThumb } from '../ui/FileThumb';
import { StatusBadge } from '../ui/StatusBadge';

export function useItemMeta(item: Item) {
  const { state } = useStore();
  const { userById, projectById } = useLookups();
  const latest = item.versions[item.versions.length - 1];
  return {
    latest,
    project: projectById.get(item.projectId),
    designer: userById.get(item.designerId),
    approver: userById.get(item.approverId),
    openComments: state.comments.filter((c) => c.itemId === item.id && c.versionId === latest.id && !c.resolved).length,
    overdue: (item.status === 'pending' || item.status === 'changes') && urgency(item.dueDate) === 'overdue',
  };
}

/** כרטיס עבודה בתצוגת רשת. show – את מי להציג: המעצב (למאשר) או המאשר (למעצב) */
export function ItemCard({ item, show = 'designer' }: { item: Item; show?: 'designer' | 'approver' }) {
  const { latest, project, designer, approver, openComments, overdue } = useItemMeta(item);
  const person = show === 'designer' ? designer : approver;

  return (
    <Link
      to={`/item/${item.id}`}
      data-testid="item-card"
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift ${
        overdue ? 'border-rose-200 ring-1 ring-rose-100' : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className="checker relative">
        <FileThumb version={latest} className="aspect-[4/3] p-3 transition duration-300 group-hover:scale-[1.02]" />
        <span className="absolute start-2 top-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-900/5" dir="ltr">
          v{latest.number}
        </span>
        {overdue && <span className="absolute end-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">באיחור</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 border-t border-zinc-100 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
          <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ backgroundColor: project?.color }} />
          <span className="truncate">{project?.name}</span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">{item.title}</h3>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pt-1">
          <StatusBadge status={item.status} />
          <DueLabel dueDate={item.dueDate} status={item.status} compact />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
          {person && (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-600">
              <Avatar user={person} size="xs" ring={false} />
              <span className="truncate">
                {show === 'approver' && <span className="text-zinc-400">אצל </span>}
                {person.name}
              </span>
            </span>
          )}
          {openComments > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-500" title="הערות פתוחות על הגרסה הנוכחית">
              <MessageSquare className="h-3.5 w-3.5" />
              {openComments}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
