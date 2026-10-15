import { Link } from 'react-router-dom';
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
  const { latest, project, designer, approver, openComments } = useItemMeta(item);
  const person = show === 'designer' ? designer : approver;

  return (
    <Link to={`/item/${item.id}`} data-testid="item-card" className="group flex flex-col">
      <div className="relative overflow-hidden rounded-lg border border-stone-200/80 bg-stone-100/70 transition group-hover:border-stone-300">
        <FileThumb version={latest} className="aspect-[4/3] p-4 transition duration-300 group-hover:scale-[1.015]" />
        <span className="mono absolute start-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-stone-600 shadow-xs" dir="ltr">
          v{latest.number}
        </span>
        {openComments > 0 && (
          <span className="num absolute end-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-signal-500 px-1.5 text-[11px] font-medium text-white" title="הערות פתוחות">
            {openComments}
          </span>
        )}
      </div>
      <div className="px-0.5 pt-2.5">
        <h3 className="truncate text-base font-medium leading-6 text-ink">{item.title}</h3>
        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-500">
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: project?.color }} />
          <span className="truncate">{project?.name}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <StatusBadge status={item.status} />
          <DueLabel dueDate={item.dueDate} status={item.status} />
        </div>
        {person && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
            <Avatar user={person} size="xs" />
            <span className="truncate">
              {show === 'approver' ? 'אצל ' : ''}
              {person.name}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
