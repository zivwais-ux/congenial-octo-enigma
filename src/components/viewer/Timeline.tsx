import { CheckCircle2, Layers, MessageSquare, Upload, Wrench, XCircle } from 'lucide-react';
import type { Item, ItemEvent } from '../../types';
import { useLookups } from '../../store/StoreProvider';
import { formatDateTime } from '../../lib/dates';
import { StatusBadge } from '../ui/StatusBadge';

function icon(e: ItemEvent) {
  if (e.type === 'uploaded') return { Icon: Upload, cls: 'bg-sky-100 text-sky-700' };
  if (e.type === 'version') return { Icon: Layers, cls: 'bg-indigo-100 text-indigo-700' };
  if (e.type === 'comment') return { Icon: MessageSquare, cls: 'bg-slate-100 text-slate-600' };
  if (e.status === 'approved') return { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' };
  if (e.status === 'rejected') return { Icon: XCircle, cls: 'bg-rose-100 text-rose-700' };
  return { Icon: Wrench, cls: 'bg-amber-100 text-amber-700' };
}

function title(e: ItemEvent) {
  switch (e.type) {
    case 'uploaded':
      return 'נשלח לאישור (גרסה 1)';
    case 'version':
      return `הועלתה גרסה ${e.versionNumber}`;
    case 'comment':
      return `הערה על גרסה ${e.versionNumber}`;
    case 'decision':
      return `החלטה על גרסה ${e.versionNumber}`;
  }
}

export function Timeline({ item }: { item: Item }) {
  const { userById } = useLookups();
  const events = [...item.events].reverse();
  return (
    <ol className="relative space-y-5 p-4" data-testid="timeline">
      <span className="absolute bottom-6 start-[29px] top-6 w-px bg-slate-200" aria-hidden />
      {events.map((e) => {
        const { Icon, cls } = icon(e);
        const author = userById.get(e.authorId);
        return (
          <li key={e.id} className="relative flex gap-3">
            <span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${cls}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold text-slate-800">{title(e)}</span>
                {e.type === 'decision' && e.status && <StatusBadge status={e.status} />}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {author?.name} · {formatDateTime(e.at)}
              </div>
              {e.text && <p className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700">{e.text}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
