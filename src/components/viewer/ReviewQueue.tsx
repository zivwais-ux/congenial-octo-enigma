import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import type { Item } from '../../types';
import type { ReviewTally } from '../layout/UIContext';
import { useLookups } from '../../store/StoreProvider';
import { dueLabel } from '../../lib/dates';
import { FileThumb } from '../ui/FileThumb';
import { Kbd } from '../ui/Kbd';
import { IconTile } from '../ui/IconTile';

/** "2 מתוך 4 בתור", עם מעבר לעבודה הקודמת והבאה */
export function QueueNav({ index, total, prevId, nextId }: { index: number; total: number; prevId?: string; nextId?: string }) {
  const btn = 'flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-ink';
  const off = 'flex h-7 w-7 items-center justify-center rounded-md border border-stone-100 text-stone-300';
  return (
    <div className="flex items-center gap-2" data-testid="queue-nav">
      <span className="num whitespace-nowrap text-sm text-stone-500">
        <span className="font-medium text-ink">{index + 1}</span> מתוך {total} בתור
      </span>
      <span className="flex gap-1">
        {prevId ? (
          <Link to={`/item/${prevId}`} className={btn} title="העבודה הקודמת (K)" aria-label="העבודה הקודמת">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={off}>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
        {nextId ? (
          <Link to={`/item/${nextId}`} className={btn} title="העבודה הבאה (J)" aria-label="העבודה הבאה" data-testid="queue-next">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className={off}>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
      </span>
    </div>
  );
}

/** מוצג אחרי החלטה: העבודה הבאה בתור, או סיכום כשהתור התרוקן */
export function NextUp({ next, remaining, tally, onGo }: { next?: Item; remaining: number; tally: ReviewTally; onGo: () => void }) {
  const { userById } = useLookups();

  if (!next) {
    const parts = [
      tally.approved && `אישרת ${tally.approved === 1 ? 'עבודה אחת' : `${tally.approved} עבודות`}`,
      tally.changes && `ביקשת תיקונים ב${tally.changes === 1 ? 'אחת' : `-${tally.changes}`}`,
      tally.rejected && `דחית ${tally.rejected === 1 ? 'אחת' : tally.rejected}`,
    ].filter(Boolean);
    return (
      <div className="border-b border-stone-200/80 bg-emerald-50/50 px-4 py-5 text-center" data-testid="queue-done">
        <IconTile icon={PartyPopper} tone="emerald" size="lg" className="mx-auto" />
        <div className="mt-3 text-base font-semibold text-ink">סיימת את התור</div>
        {parts.length > 0 && <p className="mt-1 text-sm text-stone-600">בסקירה הזו: {parts.join(', ')}.</p>}
        <Link to="/" className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-300/80 bg-white px-3 text-sm font-medium text-ink shadow-xs transition hover:bg-stone-50">
          חזרה לתור האישורים
        </Link>
      </div>
    );
  }

  const designer = userById.get(next.designerId);
  const latest = next.versions[next.versions.length - 1];
  return (
    <>
      <div className="hidden border-b border-stone-200/80 bg-stone-50/70 px-4 py-4 lg:block" data-testid="next-up">
        <div className="mb-2.5 flex items-baseline justify-between text-sm">
          <span className="font-medium text-ink">הבא בתור</span>
          <span className="num text-xs text-stone-400">{remaining === 1 ? 'נשארה עבודה אחת' : `נשארו ${remaining}`}</span>
        </div>
        <button onClick={onGo} className="group flex w-full items-center gap-3 rounded-lg border border-stone-200 bg-white p-2.5 text-start transition hover:border-stone-300 hover:shadow-xs">
          <FileThumb version={latest} className="h-11 w-14 shrink-0 rounded-md border border-stone-200 bg-stone-100/70 p-1" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{next.title}</span>
            <span className="block truncate text-xs text-stone-500">
              {designer?.name} · {dueLabel(next.dueDate)}
            </span>
          </span>
          <ArrowLeft className="h-4 w-4 shrink-0 text-stone-400 transition group-hover:-translate-x-0.5 group-hover:text-ink" />
        </button>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-stone-400">
          <Kbd>Enter</Kbd> למעבר לעבודה הבאה
        </div>
      </div>

      {/* מובייל: סרגל קבוע בתחתית במקום כפתורי ההחלטה */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <button onClick={onGo} className="flex h-11 w-full items-center gap-3 rounded-lg bg-ink px-3 text-start text-white">
          <span className="text-sm text-stone-300">הבא בתור</span>
          <span className="min-w-0 flex-1 truncate text-base font-medium">{next.title}</span>
          <ArrowLeft className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </>
  );
}
