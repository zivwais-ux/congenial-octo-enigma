import { CheckCircle2, Layers, MessageSquare, Send, Wrench, XCircle } from 'lucide-react';
import type { Item, ItemEvent } from '../../types';
import { useLookups } from '../../store/StoreProvider';
import { formatDateTime } from '../../lib/dates';
import { StatusBadge } from '../ui/StatusBadge';

function icon(e: ItemEvent) {
  if (e.type === 'uploaded') return { Icon: Send, cls: 'bg-sky-100 text-sky-700' };
  if (e.type === 'version') return { Icon: Layers, cls: 'bg-indigo-100 text-indigo-700' };
  if (e.type === 'comment') return { Icon: MessageSquare, cls: 'bg-zinc-100 text-zinc-600' };
  if (e.status === 'approved') return { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' };
  if (e.status === 'rejected') return { Icon: XCircle, cls: 'bg-rose-100 text-rose-700' };
  return { Icon: Wrench, cls: 'bg-amber-100 text-amber-700' };
}

function title(e: ItemEvent) {
  switch (e.type) {
    case 'uploaded':
      return 'נשלח לאישור';
    case 'version':
      return `גרסה ${e.versionNumber} הועלתה`;
    case 'comment':
      return `הערה על גרסה ${e.versionNumber}`;
    case 'decision':
      return `החלטה על גרסה ${e.versionNumber}`;
  }
}

/** ציר הזמן של העבודה: מי עשה מה ומתי */
export function Timeline({ item }: { item: Item }) {
  const { userById } = useLookups();
  const events = [...item.events].reverse();
  return (
    <ol className="relative p-4" data-testid="timeline">
      {events.map((e, idx) => {
        const { Icon, cls } = icon(e);
        const author = userById.get(e.authorId);
        const last = idx === events.length - 1;
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span className="absolute bottom-0 start-[13px] top-8 w-px bg-zinc-200" aria-hidden />}
            <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${cls}`}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-zinc-900">{title(e)}</span>
                {e.type === 'decision' && e.status && <StatusBadge status={e.status} />}
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                {author?.name} · {formatDateTime(e.at)}
              </div>
              {e.text && (
                <p className={`mt-2 rounded-lg px-3 py-2 text-[13px] leading-relaxed ${e.type === 'decision' ? 'border-s-2 border-zinc-300 bg-zinc-50 text-zinc-700' : 'bg-zinc-50 text-zinc-600'}`}>
                  {e.text}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
