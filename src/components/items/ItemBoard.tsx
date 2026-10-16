import { Link } from 'react-router-dom';
import { Hourglass, MessageSquare, Repeat, Timer, type LucideIcon } from 'lucide-react';
import type { Item, Status } from '../../types';
import { STATUS_META } from '../../lib/status';
import { boardInsights } from '../../lib/items';
import { IconTile } from '../ui/IconTile';
import { Avatar } from '../ui/Avatar';
import { DueLabel } from '../ui/DueLabel';
import { FileThumb } from '../ui/FileThumb';
import { ProjectChip } from '../ui/ProjectChip';
import { useItemMeta } from './ItemCard';

const COLUMNS: { status: Status; title: string }[] = [
  { status: 'pending', title: 'ממתין לאישור' },
  { status: 'changes', title: 'בתיקונים' },
  { status: 'approved', title: 'אושר' },
  { status: 'rejected', title: 'נדחה' },
];

const byDue = (a: Item, b: Item) => a.dueDate.localeCompare(b.dueDate);
const byRecent = (a: Item, b: Item) => b.versions[b.versions.length - 1].uploadedAt.localeCompare(a.versions[a.versions.length - 1].uploadedAt);

/** תצוגת לוח: כל העבודות לפי שלב, עם תמונת מצב קצרה למעלה */
export function ItemBoard({ items }: { items: Item[] }) {
  const insights = boardInsights(items);
  return (
    <div className="pt-6" data-testid="item-board">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Insight icon={Timer} tone="emerald" label="זמן אישור ממוצע" value={insights.avgDays === null ? '—' : `${fmt(insights.avgDays)} ימים`} hint="מהעלאה ועד אישור" />
        <Insight icon={Repeat} tone="violet" label="סבבים לעבודה" value={insights.avgRounds === null ? '—' : fmt(insights.avgRounds)} hint="ממוצע גרסאות עד החלטה" />
        <Insight
          icon={Hourglass}
          tone="amber"
          label="מחכה הכי הרבה זמן"
          value={insights.longest ? `${fmt(insights.longest.days)} ימים` : '—'}
          hint={insights.longest?.item.title ?? 'אין עבודות ממתינות'}
          to={insights.longest ? `/item/${insights.longest.item.id}` : undefined}
        />
      </div>

      {/* במובייל: גלילה אופקית בתוך הלוח בלבד */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {COLUMNS.map((col) => {
          const list = items.filter((i) => i.status === col.status).sort(col.status === 'approved' || col.status === 'rejected' ? byRecent : byDue);
          const meta = STATUS_META[col.status];
          return (
            <section
              key={col.status}
              className="flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col rounded-lg bg-stone-100/70 p-2 lg:w-auto lg:max-w-none"
              data-testid="board-column"
              data-status={col.status}
            >
              <h3 className="flex items-center gap-2 px-1.5 pb-2 pt-1 text-sm font-medium text-ink">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {col.title}
                <span className="num font-normal text-stone-400">{list.length}</span>
              </h3>
              <div className="flex flex-col gap-2">
                {list.map((i) => (
                  <BoardCard key={i.id} item={i} />
                ))}
                {list.length === 0 && <div className="rounded-md border border-dashed border-stone-300 px-3 py-6 text-center text-xs text-stone-400">אין עבודות בשלב הזה</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({ item }: { item: Item }) {
  const { latest, project, designer, approver, openComments, overdue } = useItemMeta(item);
  return (
    <Link
      to={`/item/${item.id}`}
      className={`group block overflow-hidden rounded-md border bg-white shadow-xs transition hover:border-stone-300 hover:shadow-sm ${overdue ? 'border-red-200 border-s-[3px] border-s-red-500' : 'border-stone-200/80'}`}
      data-testid="board-card"
    >
      <div className="flex gap-2.5 p-2.5">
        <FileThumb version={latest} className="h-12 w-14 shrink-0 rounded border border-stone-200/70 bg-stone-100/70 p-1" />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-medium leading-snug text-ink">{item.title}</div>
          <div className="mt-1">
            <ProjectChip project={project} size="xs" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-stone-100 px-2.5 py-1.5 text-xs">
        <DueLabel dueDate={item.dueDate} status={item.status} />
        {openComments > 0 && (
          <span className="num inline-flex items-center gap-0.5 text-stone-500">
            <MessageSquare className="h-3 w-3" />
            {openComments}
          </span>
        )}
        <span className="mono text-stone-400" dir="ltr">
          v{latest.number}
        </span>
        <span className="ms-auto flex -space-x-1.5 rtl:space-x-reverse">
          {designer && <Avatar user={designer} size="xs" ring />}
          {approver && <Avatar user={approver} size="xs" ring />}
        </span>
      </div>
    </Link>
  );
}

function Insight({ icon, tone, label, value, hint, to }: { icon: LucideIcon; tone: 'emerald' | 'violet' | 'amber'; label: string; value: string; hint: string; to?: string }) {
  const body = (
    <>
      <span className="hidden sm:block">
        <IconTile icon={icon} tone={tone} />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-xs text-stone-500">{label}</div>
        <div className="num mt-0.5 truncate text-sm font-semibold text-ink sm:text-base">{value}</div>
        <div className="hidden truncate text-xs text-stone-400 sm:block">{hint}</div>
      </div>
    </>
  );
  const cls = 'flex min-w-0 items-center gap-3 rounded-lg border border-stone-200/80 bg-white px-2.5 py-2 sm:px-3 sm:py-2.5';
  return to ? (
    <Link to={to} className={`${cls} transition hover:border-stone-300`} data-testid="insight">
      {body}
    </Link>
  ) : (
    <div className={cls} data-testid="insight">
      {body}
    </div>
  );
}

const fmt = (n: number) =>
  (Math.round(n * 10) / 10).toLocaleString('he-IL', {
    maximumFractionDigits: 1,
  });
