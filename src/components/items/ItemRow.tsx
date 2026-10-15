import { Link } from 'react-router-dom';
import type { Item } from '../../types';
import { timeAgo } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import { DueLabel } from '../ui/DueLabel';
import { FileThumb } from '../ui/FileThumb';
import { StatusBadge } from '../ui/StatusBadge';
import { useItemMeta } from './ItemCard';

const COLS = 'sm:grid-cols-[minmax(0,1fr)_11rem_8.5rem_9rem_6rem]';

/** שורת עבודה בטבלה – צפופה ומהירה לסריקה */
export function ItemRow({ item, show = 'designer' }: { item: Item; show?: 'designer' | 'approver' }) {
  const { latest, project, designer, approver, openComments, overdue } = useItemMeta(item);
  const person = show === 'designer' ? designer : approver;
  return (
    <Link
      to={`/item/${item.id}`}
      data-testid="item-card"
      className={`group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-stone-50 ${COLS}`}
    >
      {overdue && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-red-600" />}
      <div className="flex min-w-0 items-center gap-3">
        <FileThumb version={latest} className="h-10 w-[52px] shrink-0 rounded border border-stone-200 bg-stone-100/70 p-1" />
        <div className="min-w-0">
          <div className="truncate text-base font-medium text-ink">{item.title}</div>
          <div className="mt-0.5 flex items-center gap-2 text-sm text-stone-500">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: project?.color }} />
              <span className="truncate">{project?.name}</span>
            </span>
            <span className="mono text-stone-400" dir="ltr">
              v{latest.number}
            </span>
            {openComments > 0 && <span className="num shrink-0 text-xs text-signal-600">{openComments === 1 ? 'הערה פתוחה' : `${openComments} הערות פתוחות`}</span>}
          </div>
        </div>
      </div>
      <div className="hidden min-w-0 items-center gap-2 text-sm text-stone-600 sm:flex">
        {person && (
          <>
            <Avatar user={person} size="sm" />
            <span className="truncate">{person.name}</span>
          </>
        )}
      </div>
      <div className="hidden sm:block">
        <DueLabel dueDate={item.dueDate} status={item.status} />
      </div>
      <div className="row-span-2 flex flex-col items-end gap-1 sm:row-span-1 sm:block">
        <StatusBadge status={item.status} />
        <span className="sm:hidden">
          <DueLabel dueDate={item.dueDate} status={item.status} />
        </span>
      </div>
      <div className="hidden text-end text-sm text-stone-400 sm:block">{timeAgo(item.events[item.events.length - 1]?.at ?? item.createdAt)}</div>
    </Link>
  );
}

export function ItemList({ items, show = 'designer' }: { items: Item[]; show?: 'designer' | 'approver' }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white">
      <div className={`hidden h-9 items-center gap-x-4 border-b border-stone-200/80 bg-stone-50/70 px-4 text-xs text-stone-500 sm:grid ${COLS}`}>
        <span>עבודה</span>
        <span>{show === 'designer' ? 'מעצב' : 'אצל'}</span>
        <span>דדליין</span>
        <span>סטטוס</span>
        <span className="text-end">עדכון אחרון</span>
      </div>
      <div className="divide-y divide-stone-100">
        {items.map((i) => (
          <ItemRow key={i.id} item={i} show={show} />
        ))}
      </div>
    </div>
  );
}
