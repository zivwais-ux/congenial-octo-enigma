import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { Item } from '../../types';
import { timeAgo } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import { DueLabel } from '../ui/DueLabel';
import { FileThumb } from '../ui/FileThumb';
import { StatusBadge } from '../ui/StatusBadge';
import { useItemMeta } from './ItemCard';

/** שורת עבודה בתצוגת רשימה – צפופה ומהירה לסריקה */
export function ItemRow({ item, show = 'designer' }: { item: Item; show?: 'designer' | 'approver' }) {
  const { latest, project, designer, approver, openComments, overdue } = useItemMeta(item);
  const person = show === 'designer' ? designer : approver;
  return (
    <Link
      to={`/item/${item.id}`}
      data-testid="item-card"
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5 transition hover:bg-zinc-50 sm:grid-cols-[auto_minmax(0,1fr)_9rem_6.5rem_8.5rem_7rem] sm:gap-4 sm:px-4"
    >
      <div className="checker relative h-12 w-16 overflow-hidden rounded-md ring-1 ring-zinc-200">
        <FileThumb version={latest} className="h-full w-full p-1" />
        {overdue && <span className="absolute inset-x-0 bottom-0 h-1 bg-rose-500" />}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-zinc-900 group-hover:text-brand-700">{item.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ backgroundColor: project?.color }} />
          <span className="truncate">{project?.name}</span>
          <span className="text-zinc-300">·</span>
          <span dir="ltr">v{latest.number}</span>
          {openComments > 0 && (
            <>
              <span className="text-zinc-300">·</span>
              <MessageSquare className="h-3 w-3" />
              {openComments}
            </>
          )}
        </div>
      </div>
      <div className="hidden min-w-0 items-center gap-1.5 text-[13px] text-zinc-600 sm:flex">
        {person && (
          <>
            <Avatar user={person} size="sm" ring={false} />
            <span className="truncate">{person.name}</span>
          </>
        )}
      </div>
      <div className="hidden sm:block">
        <DueLabel dueDate={item.dueDate} status={item.status} compact />
      </div>
      <div className="flex justify-end sm:justify-start">
        <StatusBadge status={item.status} />
      </div>
      <div className="hidden text-end text-xs text-zinc-400 sm:block">{timeAgo(item.events[item.events.length - 1]?.at ?? item.createdAt)}</div>
    </Link>
  );
}

export function ItemList({ items, show }: { items: Item[]; show?: 'designer' | 'approver' }) {
  return (
    <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card">
      {items.map((i) => (
        <ItemRow key={i.id} item={i} show={show} />
      ))}
    </div>
  );
}
