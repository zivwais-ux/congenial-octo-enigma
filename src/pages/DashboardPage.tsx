import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Inbox, Plus, Wrench } from 'lucide-react';
import type { Item, Status } from '../types';
import { useLookups, useStore } from '../store/StoreProvider';
import { applyFilters, EMPTY_FILTERS, ItemFilters, type Filters } from '../components/items/ItemFilters';
import { ItemCard } from '../components/items/ItemCard';
import { daysUntil, urgency } from '../lib/dates';
import { STATUS_META } from '../lib/status';

const byDue = (a: Item, b: Item) => a.dueDate.localeCompare(b.dueDate);

function countByStatus(items: Item[]) {
  const c: Record<Status, number> = { pending: 0, changes: 0, approved: 0, rejected: 0 };
  items.forEach((i) => c[i.status]++);
  return c;
}

export function DashboardPage() {
  const { currentUser } = useStore();
  return currentUser.role === 'approver' ? <ApproverDashboard /> : <DesignerDashboard />;
}

function ApproverDashboard() {
  const { state, currentUser } = useStore();
  const lookups = useLookups();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const mine = state.items.filter((i) => i.approverId === currentUser.id);
  const waiting = mine.filter((i) => i.status === 'pending').sort(byDue);
  const overdue = waiting.filter((i) => urgency(i.dueDate) === 'overdue');
  const soon = waiting.filter((i) => daysUntil(i.dueDate) >= 0 && daysUntil(i.dueDate) <= 2);
  const approvedByMe = mine.filter((i) => i.status === 'approved').length;

  const filteredWaiting = applyFilters(waiting, filters, lookups);
  const withDesigner = applyFilters(
    mine.filter((i) => i.status === 'changes'),
    filters,
    lookups,
  ).sort(byDue);
  const others = applyFilters(
    state.items.filter((i) => !(i.approverId === currentUser.id && (i.status === 'pending' || i.status === 'changes'))),
    filters,
    lookups,
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Page>
      <Greeting
        title={`שלום, ${currentUser.name.split(' ')[0]}`}
        subtitle={
          waiting.length === 0
            ? 'אין עבודות שמחכות לך כרגע. יופי.'
            : `${waiting.length} עבודות מחכות לאישורך${overdue.length ? `, ${overdue.length} מהן באיחור` : ''}.`
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Inbox className="h-4 w-4" />} label="מחכות לאישורי" value={waiting.length} tone="sky" />
        <Stat icon={<AlertTriangle className="h-4 w-4" />} label="באיחור" value={overdue.length} tone="rose" />
        <Stat icon={<Clock className="h-4 w-4" />} label="דדליין ב-48 שעות" value={soon.length} tone="amber" />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="אישרתי" value={approvedByMe} tone="emerald" />
      </div>

      <ItemFilters value={filters} onChange={setFilters} counts={countByStatus(state.items)} />

      <Section
        title="מחכה לאישורי"
        count={filteredWaiting.length}
        accent="sky"
        hint="ממוין לפי דדליין, הדחוף ראשון"
        empty="אין עבודות שמחכות לאישורך"
      >
        {filteredWaiting.map((i) => (
          <ItemCard key={i.id} item={i} />
        ))}
      </Section>

      {withDesigner.length > 0 && (
        <Section title="חזרו למעצב לתיקונים" count={withDesigner.length} hint="ממתינים לגרסה חדשה">
          {withDesigner.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
        </Section>
      )}

      <Section title="כל העבודות במחלקה" count={others.length} empty="לא נמצאו עבודות">
        {others.map((i) => (
          <ItemCard key={i.id} item={i} />
        ))}
      </Section>
    </Page>
  );
}

const DESIGNER_GROUPS: { status: Status; title: string; hint?: string }[] = [
  { status: 'changes', title: 'נדרשים תיקונים', hint: 'המאשר ביקש שינויים, הכדור אצלך' },
  { status: 'pending', title: 'ממתין לאישור', hint: 'נשלח, מחכה להחלטה' },
  { status: 'rejected', title: 'נדחה' },
  { status: 'approved', title: 'מאושר' },
];

function DesignerDashboard() {
  const { state, currentUser } = useStore();
  const lookups = useLookups();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const mine = useMemo(() => state.items.filter((i) => i.designerId === currentUser.id), [state.items, currentUser.id]);
  const filtered = applyFilters(mine, filters, lookups);
  const counts = countByStatus(mine);

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Greeting
          title={`שלום, ${currentUser.name.split(' ')[0]}`}
          subtitle={
            counts.changes > 0
              ? `${counts.changes} עבודות חזרו אליך לתיקונים.`
              : counts.pending > 0
                ? `${counts.pending} עבודות ממתינות לאישור. אין כרגע מה לתקן.`
                : 'אין עבודות פתוחות. זמן טוב להעלות משהו חדש.'
          }
        />
        <Link
          to="/upload"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          העלאת עבודה חדשה
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Wrench className="h-4 w-4" />} label="נדרשים תיקונים" value={counts.changes} tone="amber" />
        <Stat icon={<Inbox className="h-4 w-4" />} label="ממתינות לאישור" value={counts.pending} tone="sky" />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="אושרו" value={counts.approved} tone="emerald" />
        <Stat icon={<AlertTriangle className="h-4 w-4" />} label="נדחו" value={counts.rejected} tone="rose" />
      </div>

      <ItemFilters value={filters} onChange={setFilters} counts={counts} />

      <h2 className="-mb-2 text-lg font-bold text-slate-900">העבודות שלי</h2>

      {filtered.length === 0 && <Empty text={mine.length ? 'לא נמצאו עבודות שתואמות לסינון' : 'עדיין לא העלית עבודות'} />}

      {DESIGNER_GROUPS.map((g) => {
        const list = filtered.filter((i) => i.status === g.status).sort(g.status === 'approved' ? (a, b) => b.createdAt.localeCompare(a.createdAt) : byDue);
        if (!list.length) return null;
        const highlight = g.status === 'changes';
        const shown = g.status === 'approved' ? list.slice(0, 4) : list;
        return (
          <div key={g.status} className={highlight ? 'rounded-2xl bg-amber-50/70 p-4 ring-1 ring-amber-200 sm:p-5' : ''}>
            <Section title={g.title} count={list.length} hint={g.hint} accent={g.status} plain>
              {shown.map((i) => (
                <ItemCard key={i.id} item={i} show="approver" />
              ))}
            </Section>
            {g.status === 'approved' && list.length > shown.length && (
              <Link to="/archive" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
                לכל העבודות המאושרות בארכיון ←
              </Link>
            )}
          </div>
        );
      })}
    </Page>
  );
}

/* ---------- רכיבי עזר ---------- */

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">{children}</div>;
}

function Greeting({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

const TONES = {
  sky: 'bg-sky-50 text-sky-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
};

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: keyof typeof TONES }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card sm:p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-none text-slate-900">{value}</div>
        <div className="mt-1 truncate text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  hint,
  empty,
  accent,
  plain,
  children,
}: {
  title: string;
  count: number;
  hint?: string;
  empty?: string;
  accent?: Status | 'sky';
  plain?: boolean;
  children: ReactNode;
}) {
  const dot = accent === 'sky' ? STATUS_META.pending.dot : accent ? STATUS_META[accent].dot : undefined;
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        {dot && <span className={`h-2 w-2 translate-y-[-2px] rounded-full ${dot}`} />}
        <h2 className={`${plain ? 'text-base' : 'text-lg'} font-bold text-slate-900`}>{title}</h2>
        <span className="text-sm text-slate-400">{count}</span>
        {hint && <span className="hidden text-xs text-slate-400 sm:inline">· {hint}</span>}
      </div>
      {count === 0 && empty ? (
        <Empty text={empty} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{children}</div>
      )}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-8 text-center text-sm text-slate-500">{text}</div>;
}
