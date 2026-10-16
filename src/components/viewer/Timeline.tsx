import { Check, Layers, ListChecks, MessageSquare, RotateCcw, Send, X } from 'lucide-react';
import type { Item, ItemEvent } from '../../types';
import { IconTile } from '../ui/IconTile';
import { useLookups } from '../../store/StoreProvider';
import { formatDateTime } from '../../lib/dates';
import { STATUS_META } from '../../lib/status';
import { checksLabel } from '../../lib/checks';

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

function icon(e: ItemEvent) {
  if (e.type === 'uploaded') return { icon: Send, tone: 'sky' as const };
  if (e.type === 'version') return { icon: Layers, tone: 'violet' as const };
  if (e.type === 'comment') return { icon: MessageSquare, tone: 'stone' as const };
  if (e.status === 'approved') return { icon: Check, tone: 'emerald' as const };
  if (e.status === 'rejected') return { icon: X, tone: 'red' as const };
  return { icon: RotateCcw, tone: 'amber' as const };
}

/** יומן הפעילות של העבודה: מי עשה מה ומתי */
function fixesOf(item: Item, versionNumber?: number) {
  return versionNumber ? (item.versions[versionNumber - 1]?.fixes?.length ?? 0) : 0;
}

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
            {!last && <span className="absolute bottom-0 start-[11.5px] top-7 w-px bg-stone-200" aria-hidden />}
            <IconTile {...icon(e)} className="relative rounded-full" />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-medium text-ink">{title(e)}</span>
                <span className="text-stone-500">{author?.name}</span>
              </div>
              <div className="num mt-0.5 text-xs text-stone-400">{formatDateTime(e.at)}</div>
              {e.text && <p className="mt-1.5 text-sm leading-5 text-stone-600">{e.text}</p>}
              {e.type === 'version' && fixesOf(item, e.versionNumber) > 0 && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  {fixesOf(item, e.versionNumber) === 1 ? 'הערה אחת טופלה' : `${fixesOf(item, e.versionNumber)} הערות טופלו`} בגרסה {e.versionNumber}
                </div>
              )}
              {e.checks && e.checks.length > 0 && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700" data-testid="timeline-checks">
                  <ListChecks className="h-3 w-3" />
                  נבדק: {checksLabel(e.checks)}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
