import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { Item } from '../../types';
import { useLookups, useStore } from '../../store/StoreProvider';
import { urgency } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import { DueLabel } from '../ui/DueLabel';
import { FileThumb } from '../ui/FileThumb';
import { StatusBadge } from '../ui/StatusBadge';

export function ItemCard({ item, show = 'designer' }: { item: Item; show?: 'designer' | 'approver' }) {
  const { state } = useStore();
  const { userById, projectById } = useLookups();
  const project = projectById.get(item.projectId);
  const person = userById.get(show === 'designer' ? item.designerId : item.approverId);
  const latest = item.versions[item.versions.length - 1];
  const openComments = state.comments.filter((c) => c.itemId === item.id && c.versionId === latest.id && !c.resolved).length;
  const isOpen = item.status === 'pending' || item.status === 'changes';
  const overdue = isOpen && urgency(item.dueDate) === 'overdue';

  return (
    <Link
      to={`/item/${item.id}`}
      data-testid="item-card"
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-md ${
        overdue ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
      }`}
    >
      <div className="relative">
        <FileThumb version={latest} className="aspect-[4/3] p-2 sm:p-3" />
        <span className="absolute start-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          v{latest.number}
        </span>
        {overdue && (
          <span className="absolute end-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            באיחור
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 border-t border-slate-100 p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand-700">{item.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project?.color }} />
          <span className="truncate">{project?.name}</span>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <StatusBadge status={item.status} />
          <DueLabel dueDate={item.dueDate} status={item.status} />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          {person && (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
              <Avatar user={person} size="xs" />
              <span className="truncate">
                {show === 'approver' ? 'מאשר/ת: ' : ''}
                {person.name}
              </span>
            </span>
          )}
          {openComments > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500" title="הערות פתוחות">
              <MessageSquare className="h-3.5 w-3.5" />
              {openComments}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
