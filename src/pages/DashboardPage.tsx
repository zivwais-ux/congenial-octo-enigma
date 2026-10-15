import { useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlarmClock, ArrowLeft, CheckCircle2, Clock3, Flame, Inbox, MessageSquare, Plus, Upload, Wrench, XCircle } from 'lucide-react';
import type { Item, Status } from '../types';
import { useLookups, useStore } from '../store/StoreProvider';
import { applyFilters, EMPTY_FILTERS, ItemFilters, type Filters, type View } from '../components/items/ItemFilters';
import { ItemCard, useItemMeta } from '../components/items/ItemCard';
import { ItemList } from '../components/items/ItemRow';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { DueLabel } from '../components/ui/DueLabel';
import { FileThumb } from '../components/ui/FileThumb';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useLocalPref } from '../hooks/useLocalPref';
import { daysUntil, urgency } from '../lib/dates';
import { STATUS_META } from '../lib/status';
import { comments, firstName, greeting, todayLabel, works } from '../lib/copy';

const byDue = (a: Item, b: Item) => a.dueDate.localeCompare(b.dueDate);
const byRecent = (a: Item, b: Item) => b.createdAt.localeCompare(a.createdAt);

function countByStatus(items: Item[]) {
  const c: Record<Status, number> = { pending: 0, changes: 0, approved: 0, rejected: 0 };
  items.forEach((i) => c[i.status]++);
  return c;
}

/** מסנן משותף, שמסתנכרן עם ?project= מהסרגל הצדדי */
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
  const [view, setView] = useLocalPref<View>('gadot:view', 'grid');

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
    if (waiting.length === 0) return 'אין כרגע עבודות שמחכות להחלטה שלך. הכל זורם.';
    if (waiting.length === 1)
      return `עבודה אחת מחכה להחלטה שלך${overdue.length ? ', והיא כבר באיחור' : soon.length ? ', עם דדליין קרוב' : ''}.`;
    const tail = overdue.length
      ? `, ${overdue.length === 1 ? 'אחת מהן כבר באיחור' : `${overdue.length} מהן כבר באיחור`}`
      : soon.length
        ? `, ${soon.length === 1 ? 'אחת מהן' : `${soon.length} מהן`} עם דדליין קרוב`
        : '';
    return `${waiting.length} עבודות מחכות להחלטה שלך${tail}.`;
  })();

  const focus = filters.projectId === 'all' ? waiting[0] : undefined;

  return (
    <Page>
      <Hero title={`${greeting()}, ${firstName(currentUser.name)}`} subtitle={summary} />

      {focus && (
        <FocusCard
          item={focus}
          eyebrow={urgency(focus.dueDate) === 'overdue' ? 'הכי דחוף עכשיו · באיחור' : 'הבא בתור'}
          cta="פתיחה וסקירה"
          show="designer"
        />
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Inbox className="h-4 w-4" />} label="מחכות להחלטה שלך" value={waiting.length} tone="sky" />
        <Stat icon={<Flame className="h-4 w-4" />} label="באיחור" value={overdue.length} tone="rose" hint={overdue.length ? 'כדאי להתחיל מהן' : 'אין איחורים'} />
        <Stat icon={<Clock3 className="h-4 w-4" />} label="דדליין ב-48 שעות" value={soon.length} tone="amber" />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="אישרת עד היום" value={approvedByMe} tone="emerald" />
      </div>

      <ItemFilters value={filters} onChange={setFilters} counts={countByStatus(state.items)} view={view} onView={setView} />

      <Section title="ממתין להחלטה שלך" count={fWaiting.length} dot="pending" hint="ממוין לפי דדליין, הדחוף ראשון">
        {fWaiting.length ? (
          <Items items={fWaiting} view={view} />
        ) : (
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6" />}
            title={waiting.length ? 'אין התאמות לסינון' : 'התור שלך ריק'}
            text={waiting.length ? 'נסו לנקות את הסינון.' : 'כשמעצב ישלח לך עבודה, היא תופיע כאן, יחד עם התראה.'}
          />
        )}
      </Section>

      {fWithDesigners.length > 0 && (
        <Section title="חזרו למעצבים לתיקונים" count={fWithDesigners.length} dot="changes" hint="מחכות לגרסה חדשה">
          <Items items={fWithDesigners} view={view} />
        </Section>
      )}

      <Section title="כל העבודות במחלקה" count={fOthers.length} hint="כולל עבודות שמאשרים אחרים מטפלים בהן">
        {fOthers.length ? <Items items={fOthers} view={view} /> : <EmptyState icon={<Inbox className="h-6 w-6" />} title="לא נמצאו עבודות" text="נסו לשנות את הסינון." />}
      </Section>
    </Page>
  );
}

/* ───────────── מעצב ───────────── */

const DESIGNER_GROUPS: { status: Status; title: string; hint: string }[] = [
  { status: 'changes', title: 'חזרו אליך לתיקונים', hint: 'ההערות מחכות על התמונה' },
  { status: 'pending', title: 'אצל המאשרים', hint: 'נשלחו, מחכות להחלטה' },
  { status: 'rejected', title: 'נדחו', hint: 'כדאי לעבור על הנימוק' },
  { status: 'approved', title: 'אושרו לאחרונה', hint: 'נשמרו בארכיון' },
];

function DesignerDashboard() {
  const { state, currentUser } = useStore();
  const lookups = useLookups();
  const [filters, setFilters] = useDashboardFilters();
  const [view, setView] = useLocalPref<View>('gadot:view', 'grid');

  const mine = state.items.filter((i) => i.designerId === currentUser.id);
  const filtered = applyFilters(mine, filters, lookups);
  const counts = countByStatus(mine);
  const toFix = mine.filter((i) => i.status === 'changes').sort(byDue);

  const summary =
    counts.changes > 0
      ? `${counts.changes === 1 ? 'עבודה אחת חזרה' : `${counts.changes} עבודות חזרו`} אליך עם הערות. ${counts.pending ? `עוד ${works(counts.pending)} אצל המאשרים.` : ''}`
      : counts.pending > 0
        ? `${works(counts.pending)} אצל המאשרים, ואין כרגע מה לתקן.`
        : 'אין עבודות פתוחות. זה זמן טוב להעלות משהו חדש.';

  return (
    <Page>
      <Hero
        title={`${greeting()}, ${firstName(currentUser.name)}`}
        subtitle={summary}
        action={
          <Link
            to="/upload"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            העלאת עבודה
          </Link>
        }
      />

      {toFix[0] && filters.projectId === 'all' && <FocusCard item={toFix[0]} eyebrow="ממתין לך" cta="לצפייה בהערות" show="approver" />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Wrench className="h-4 w-4" />} label="חזרו לתיקונים" value={counts.changes} tone="amber" />
        <Stat icon={<AlarmClock className="h-4 w-4" />} label="אצל המאשרים" value={counts.pending} tone="sky" />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="אושרו" value={counts.approved} tone="emerald" />
        <Stat icon={<XCircle className="h-4 w-4" />} label="נדחו" value={counts.rejected} tone="rose" />
      </div>

      <ItemFilters value={filters} onChange={setFilters} counts={counts} view={view} onView={setView} />

      {filtered.length === 0 && (
        <EmptyState
          icon={<Upload className="h-6 w-6" />}
          title={mine.length ? 'אין התאמות לסינון' : 'עוד לא העלית עבודות'}
          text={mine.length ? 'נסו לנקות את הסינון.' : 'מעלים קובץ, בוחרים מאשר, וזהו. בלי מייל ובלי קבצים מצורפים.'}
          action={
            !mine.length && (
              <Link to="/upload" className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" />
                העלאת עבודה ראשונה
              </Link>
            )
          }
        />
      )}

      {DESIGNER_GROUPS.map((g) => {
        const list = filtered.filter((i) => i.status === g.status).sort(g.status === 'approved' ? byRecent : byDue);
        if (!list.length) return null;
        const shown = g.status === 'approved' ? list.slice(0, 4) : list;
        return (
          <Section key={g.status} title={g.title} count={list.length} hint={g.hint} dot={g.status}>
            <Items items={shown} view={view} show="approver" />
            {list.length > shown.length && (
              <Link to="/archive" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                לכל {list.length} העבודות שאושרו, בארכיון
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
          </Section>
        );
      })}
    </Page>
  );
}

/* ───────────── רכיבי עזר ───────────── */

export function Page({ children }: { children: ReactNode }) {
  return <div className="anim-rise mx-auto flex max-w-[88rem] flex-col gap-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>;
}

function Hero({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-xs font-medium text-zinc-400">{todayLabel()}</div>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-zinc-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function FocusCard({ item, eyebrow, cta, show }: { item: Item; eyebrow: string; cta: string; show: 'designer' | 'approver' }) {
  const { latest, project, designer, approver, openComments, overdue } = useItemMeta(item);
  const person = show === 'designer' ? designer : approver;
  return (
    <Link
      to={`/item/${item.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card transition hover:shadow-lift sm:flex-row"
      data-testid="focus-card"
    >
      <div className="stage-grid flex items-center justify-center p-4 sm:w-72 sm:shrink-0">
        <FileThumb version={latest} className="h-40 w-full transition duration-300 group-hover:scale-[1.03] sm:h-36" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 p-5 sm:p-6">
        <span className={`inline-flex w-fit items-center gap-1.5 text-xs font-bold ${overdue ? 'text-rose-600' : 'text-brand-700'}`}>
          {overdue ? <Flame className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
          {eyebrow}
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">{item.title}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[3px]" style={{ backgroundColor: project?.color }} />
              {project?.name}
            </span>
            {person && (
              <span className="flex items-center gap-1.5">
                <Avatar user={person} size="xs" ring={false} />
                {person.name}
              </span>
            )}
            <span dir="ltr">v{latest.number}</span>
            {openComments > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {comments(openComments)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={item.status} />
          <DueLabel dueDate={item.dueDate} status={item.status} />
        </div>
      </div>
      <div className="flex items-center border-t border-zinc-100 p-4 sm:border-0 sm:p-6">
        <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition group-hover:bg-zinc-800 sm:w-auto">
          {cta}
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

const TONES = {
  sky: 'bg-sky-50 text-sky-600 ring-sky-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
};

function Stat({ icon, label, value, tone, hint }: { icon: ReactNode; label: string; value: number; tone: keyof typeof TONES; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium leading-tight text-zinc-500">{label}</span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${TONES[tone]}`}>{icon}</span>
      </div>
      <div className="mt-2 text-[28px] font-bold leading-none tracking-tight text-zinc-900">{value}</div>
      {hint && <div className="mt-1.5 truncate text-xs text-zinc-400">{hint}</div>}
    </div>
  );
}

function Section({ title, count, hint, dot, children }: { title: string; count: number; hint?: string; dot?: Status; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        {dot && <span className={`h-2 w-2 -translate-y-px rounded-full ${STATUS_META[dot].dot}`} />}
        <h2 className="text-base font-bold text-zinc-900">{title}</h2>
        <span className="text-sm font-medium text-zinc-400">{count}</span>
        {hint && <span className="hidden text-xs text-zinc-400 sm:inline">· {hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Items({ items, view, show = 'designer' }: { items: Item[]; view: View; show?: 'designer' | 'approver' }) {
  if (view === 'list') return <ItemList items={items} show={show} />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {items.map((i) => (
        <ItemCard key={i.id} item={i} show={show} />
      ))}
    </div>
  );
}
