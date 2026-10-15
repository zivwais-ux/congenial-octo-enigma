import type { Item, ItemEvent } from '../../types';
import { useLookups } from '../../store/StoreProvider';
import { formatDateTime } from '../../lib/dates';
import { STATUS_META } from '../../lib/status';

function title(e: ItemEvent) {
  switch (e.type) {
    case 'uploaded':
      return 'שליחה לאישור';
    case 'version':
      return `גרסה ${e.versionNumber} הועלתה`;
    case 'comment':
      return `הערה על גרסה ${e.versionNumber}`;
    case 'decision':
      return e.status ? STATUS_META[e.status].label : 'החלטה';
  }
}

function dot(e: ItemEvent) {
  if (e.type === 'decision' && e.status) return STATUS_META[e.status].dot;
  if (e.type === 'comment') return 'bg-stone-300';
  return 'bg-ink';
}

/** יומן הפעילות של העבודה: מי עשה מה ומתי */
export function Timeline({ item }: { item: Item }) {
  const { userById } = useLookups();
  const events = [...item.events].reverse();
  return (
    <ol className="px-4 py-4" data-testid="timeline">
      {events.map((e, idx) => {
        const author = userById.get(e.authorId);
        const last = idx === events.length - 1;
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span className="absolute bottom-0 start-[3.5px] top-4 w-px bg-stone-200" aria-hidden />}
            <span className={`relative mt-[7px] h-2 w-2 shrink-0 rounded-full ring-4 ring-white ${dot(e)}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-medium text-ink">{title(e)}</span>
                <span className="text-stone-500">{author?.name}</span>
              </div>
              <div className="num mt-0.5 text-xs text-stone-400">{formatDateTime(e.at)}</div>
              {e.text && <p className="mt-1.5 text-sm leading-5 text-stone-600">{e.text}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
