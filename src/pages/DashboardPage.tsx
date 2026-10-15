import { useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import type { Item, Status } from '../types';
import { useLookups, useStore } from '../store/StoreProvider';
import { applyFilters, EMPTY_FILTERS, ItemFilters, type Filters, type View } from '../components/items/ItemFilters';
import { ItemCard, useItemMeta } from '../components/items/ItemCard';
import { ItemList } from '../components/items/ItemRow';
import { EmptyState } from '../components/ui/EmptyState';
import { useLocalPref } from '../hooks/useLocalPref';
import { daysUntil, dueLabel, urgency } from '../lib/dates';
import { works } from '../lib/copy';

const byDue = (a: Item, b: Item) => a.dueDate.localeCompare(b.dueDate);
const byRecent = (a: Item, b: Item) => b.createdAt.localeCompare(a.createdAt);

function countByStatus(items: Item[]) {
  const c: Record<Status, number> = { pending: 0, changes: 0, approved: 0, rejected: 0 };
  items.forEach((i) => c[i.status]++);
  return c;
}

/** סינון שמסתנכרן עם ?project= מהסרגל הצדדי */
function useDashboardFilters() {
  const [params, setParams] = useSearchParams();
  const project = params.get('project') ?? 'all';
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, projectId: project });
  useEffect(() => setFilters((f) => ({ ...f, projectId: project })), [project]);
  const onChange = (f: Filters) => {
    setFilters(f);
    if (f.projectId !== project) setParams(f.projectId === 'all' ? {} : { project: f.projectId }, { replace: true });
  };
  return [filters, onChange] as const;
}

export function DashboardPage() {
  const { currentUser } = useStore();
  return currentUser.role === 'approver' ? <ApproverDashboard /> : <DesignerDashboard />;
}

/* ───────────── מאשר ───────────── */

function ApproverDashboard() {
  const { state, currentUser } = useStore();
  const lookups = useLookups();
  const [filters, setFilters] = useDashboardFilters();
  const [view, setView] = useLocalPref<View>('gadot:view.v3', 'list');

  const mine = state.items.filter((i) => i.approverId === currentUser.id);
  const waiting = mine.filter((i) => i.status === 'pending').sort(byDue);
  const overdue = waiting.filter((i) => urgency(i.dueDate) === 'overdue');
  const soon = waiting.filter((i) => daysUntil(i.dueDate) >= 0 && daysUntil(i.dueDate) <= 2);
  const withDesigners = mine.filter((i) => i.status === 'changes');
  const approvedByMe = mine.filter((i) => i.status === 'approved').length;

  const fWaiting = applyFilters(waiting, filters, lookups);
  const fWithDesigners = applyFilters(withDesigners, filters, lookups).sort(byDue);
  const fOthers = applyFilters(
    state.items.filter((i) => !(i.approverId === currentUser.id && (i.status === 'pending' || i.status === 'changes'))),
    filters,
    lookups,
  ).sort(byRecent);

  const summary = (() => {
    if (waiting.length === 0) return 'אין כרגע עבודות שמחכות להחלטה שלך.';
    if (waiting.length === 1) return `עבודה אחת מחכה להחלטה שלך${overdue.length ? ', והיא כבר באיחור' : soon.length ? ', עם דדליין קרוב' : ''}.`;
    const tail = overdue.length ? `, ${overdue.length === 1 ? 'אחת מהן באיחור' : `${overdue.length} מהן באיחור`}` : '';
    return `${waiting.length} עבודות מחכות להחלטה שלך${tail}.`;
  })();

  return (
    <Page>
      <PageHeader title="תור האישורים" subtitle={summary} />

      <Metrics
        items={[
          { label: 'מחכות להחלטה', value: waiting.length },
          { label: 'באיחור', value: overdue.length, alert: overdue.length > 0 },
          { label: 'דדליין ב-48 שעות', value: soon.length },
          { label: 'אושרו על ידך', value: approvedByMe },
        ]}
      />

      {overdue[0] && filters.projectId === 'all' && <Attention item={overdue[0]} label="באיחור" tone="red" cta="לסקירה" />}

      <div>
        <ItemFilters value={filters} onChange={setFilters} counts={countByStatus(state.items)} view={view} onView={setView} />

        <Section title="מחכה להחלטה שלך" count={fWaiting.length}>
          {fWaiting.length ? (
            <Items items={fWaiting} view={view} />
          ) : (
            <EmptyState title={waiting.length ? 'אין התאמות לסינון' : 'התור ריק'} text={waiting.length ? 'נסו לנקות את הסינון.' : 'כשמעצב ישלח לך עבודה, היא תופיע כאן ותישלח אליך התראה.'} />
          )}
        </Section>

        {fWithDesigners.length > 0 && (
          <Section title="אצל המעצבים לתיקונים" count={fWithDesigners.length}>
            <Items items={fWithDesigners} view={view} />
          </Section>
        )}

        <Section title="כל העבודות במחלקה" count={fOthers.length}>
          {fOthers.length ? <Items items={fOthers} view={view} /> : <EmptyState title="לא נמצאו עבודות" text="נסו לשנות את הסינון." />}
        </Section>
      </div>
    </Page>
  );
}

/* ───────────── מעצב ───────────── */

const DESIGNER_GROUPS: { status: Status; title: string }[] = [
  { status: 'changes', title: 'חזרו אליך לתיקונים' },
  { status: 'pending', title: 'אצל המאשרים' },
  { status: 'rejected', title: 'נדחו' },
  { status: 'approved', title: 'אושרו לאחרונה' },
];

function DesignerDashboard() {
  const { state, currentUser } = useStore();
  const lookups = useLookups();
  const [filters, setFilters] = useDashboardFilters();
  const [view, setView] = useLocalPref<View>('gadot:view.v3', 'list');

  const mine = state.items.filter((i) => i.designerId === currentUser.id);
  const filtered = applyFilters(mine, filters, lookups);
  const counts = countByStatus(mine);
  const toFix = mine.filter((i) => i.status === 'changes').sort(byDue);

  const summary =
    counts.changes > 0
      ? `${counts.changes === 1 ? 'עבודה אחת חזרה' : `${counts.changes} עבודות חזרו`} אליך עם הערות${counts.pending ? `, ועוד ${works(counts.pending)} אצל המאשרים` : ''}.`
      : counts.pending > 0
        ? `${works(counts.pending)} אצל המאשרים. אין כרגע מה לתקן.`
        : 'אין עבודות פתוחות.';

  return (
    <Page>
      <PageHeader
        title="העבודות שלי"
        subtitle={summary}
        action={
          <Link to="/upload" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-3.5 text-base font-medium text-white transition hover:bg-stone-800">
            <Plus className="h-4 w-4" />
            העלאת עבודה
          </Link>
        }
      />

      <Metrics
        items={[
          { label: 'חזרו לתיקונים', value: counts.changes, alert: counts.changes > 0, alertTone: 'amber' },
          { label: 'אצל המאשרים', value: counts.pending },
          { label: 'אושרו', value: counts.approved },
          { label: 'נדחו', value: counts.rejected },
        ]}
      />

      {toFix[0] && filters.projectId === 'all' && <Attention item={toFix[0]} label="מחכה לך" tone="amber" cta="להערות" show="approver" />}

      <div>
        <ItemFilters value={filters} onChange={setFilters} counts={counts} view={view} onView={setView} />

        {filtered.length === 0 && (
          <div className="pt-6">
            <EmptyState
              title={mine.length ? 'אין התאמות לסינון' : 'עוד לא העלית עבודות'}
              text={mine.length ? 'נסו לנקות את הסינון.' : 'מעלים קובץ, בוחרים מאשר, וזהו. בלי מייל ובלי קבצים מצורפים.'}
              action={
                !mine.length && (
                  <Link to="/upload" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-3.5 text-base font-medium text-white">
                    <Plus className="h-4 w-4" />
                    העלאת עבודה
                  </Link>
                )
              }
            />
          </div>
        )}

        {DESIGNER_GROUPS.map((g) => {
          const list = filtered.filter((i) => i.status === g.status).sort(g.status === 'approved' ? byRecent : byDue);
          if (!list.length) return null;
          const shown = g.status === 'approved' ? list.slice(0, 4) : list;
          return (
            <Section key={g.status} title={g.title} count={list.length}>
              <Items items={shown} view={view} show="approver" />
              {list.length > shown.length && (
                <Link to="/archive" className="mt-3 inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-ink">
                  לכל העבודות שאושרו
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              )}
            </Section>
          );
        })}
      </div>
    </Page>
  );
}

/* ───────────── רכיבי עזר ───────────── */

export function Page({ children }: { children: ReactNode }) {
  return <div className="anim-rise mx-auto flex max-w-[76rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-8 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-base text-stone-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Metrics({ items }: { items: { label: string; value: number; alert?: boolean; alertTone?: 'red' | 'amber' }[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-stone-200/80 bg-white sm:grid-cols-4">
      {items.map((m, i) => (
        <div
          key={m.label}
          className={`px-4 py-3.5 sm:px-5 ${i % 2 === 1 ? 'border-s border-stone-200/80' : ''} ${i >= 2 ? 'border-t border-stone-200/80 sm:border-t-0' : ''} ${i === 2 ? 'sm:border-s' : ''}`}
        >
          <dt className="text-sm text-stone-500">{m.label}</dt>
          <dd className={`num mt-1 text-[26px] font-medium leading-8 ${m.alert ? (m.alertTone === 'amber' ? 'text-amber-700' : 'text-red-700') : 'text-ink'}`}>{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Attention({ item, label, tone, cta, show = 'designer' }: { item: Item; label: string; tone: 'red' | 'amber'; cta: string; show?: 'designer' | 'approver' }) {
  const { latest, designer, approver, openComments } = useItemMeta(item);
  const person = show === 'designer' ? designer : approver;
  return (
    <Link
      to={`/item/${item.id}`}
      className="group flex items-center gap-3 rounded-lg border border-stone-200/80 bg-white py-2.5 pe-3 ps-3 transition hover:border-stone-300 sm:gap-4 sm:ps-4"
      data-testid="focus-card"
    >
      <span className={`flex items-center gap-1.5 text-sm font-medium ${tone === 'red' ? 'text-red-700' : 'text-amber-700'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${tone === 'red' ? 'bg-red-600' : 'bg-amber-500'}`} />
        {label}
      </span>
      <span className="h-4 w-px bg-stone-200" />
      <span className="min-w-0 flex-1 truncate text-base">
        <span className="font-medium text-ink">{item.title}</span>
        <span className="hidden text-stone-500 sm:inline">
          {' · '}
          {person?.name}
          {' · '}
          {show === 'designer' ? dueLabel(item.dueDate) : openComments ? `${openComments} הערות פתוחות` : `גרסה ${latest.number}`}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink">
        {cta}
        <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
      </span>
    </Link>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="pt-7">
      <h2 className="mb-3 flex items-baseline gap-2 text-base font-semibold">
        {title}
        <span className="num text-sm font-normal text-stone-400">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function Items({ items, view, show = 'designer' }: { items: Item[]; view: View; show?: 'designer' | 'approver' }) {
  if (view === 'list') return <ItemList items={items} show={show} />;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 xl:grid-cols-4">
      {items.map((i) => (
        <ItemCard key={i.id} item={i} show={show} />
      ))}
    </div>
  );
}
