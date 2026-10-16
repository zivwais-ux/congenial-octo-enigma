import { Columns3, LayoutGrid, Rows3, Search, X } from 'lucide-react';
import type { Item, Status } from '../../types';
import { STATUS_META, STATUS_ORDER } from '../../lib/status';
import { useLookups, useStore } from '../../store/StoreProvider';

export interface Filters {
  q: string;
  status: Status | 'all';
  projectId: string | 'all';
}

export const EMPTY_FILTERS: Filters = { q: '', status: 'all', projectId: 'all' };

export type View = 'grid' | 'list' | 'board';

export function applyFilters(items: Item[], f: Filters, lookups: ReturnType<typeof useLookups>) {
  const q = f.q.trim();
  return items.filter((i) => {
    if (f.status !== 'all' && i.status !== f.status) return false;
    if (f.projectId !== 'all' && i.projectId !== f.projectId) return false;
    if (q) {
      const hay = [i.title, lookups.projectById.get(i.projectId)?.name, lookups.userById.get(i.designerId)?.name, lookups.userById.get(i.approverId)?.name].join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function ItemFilters({
  value,
  onChange,
  counts,
  view,
  onView,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  counts: Record<Status, number>;
  view: View;
  onView: (v: View) => void;
}) {
  const { state } = useStore();
  const active = value.q || value.status !== 'all' || value.projectId !== 'all';
  const total = STATUS_ORDER.reduce((n, s) => n + counts[s], 0);
  const tab = (key: Status | 'all', label: string, count: number, dot?: string) => (
    <button
      key={key}
      type="button"
      onClick={() => onChange({ ...value, status: key })}
      aria-pressed={value.status === key}
      className={`-mb-px flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-b text-sm transition-colors ${
        value.status === key ? 'border-ink font-medium text-ink' : 'border-transparent text-stone-500 hover:text-ink'
      }`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label}
      <span className="num text-xs text-stone-400">{count}</span>
    </button>
  );
  return (
    <div className="flex flex-col gap-3 border-b border-stone-200/80 lg:flex-row lg:items-end lg:gap-6">
      <div className="no-scrollbar -mx-4 -mb-px flex gap-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tab('all', 'הכל', total)}
        {STATUS_ORDER.map((s) => tab(s, STATUS_META[s].label, counts[s], STATUS_META[s].dot))}
      </div>
      <div className="flex items-center gap-2 pb-2.5 lg:ms-auto">
        <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input type="search" value={value.q} onChange={(e) => onChange({ ...value, q: e.target.value })} placeholder="סינון…" className="input h-8 py-0 ps-8 text-sm" aria-label="סינון" />
        </div>
        <select value={value.projectId} onChange={(e) => onChange({ ...value, projectId: e.target.value })} className="input h-8 w-auto max-w-[10.5rem] py-0 text-sm" aria-label="פרויקט">
          <option value="all">כל הפרויקטים</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {active && (
          <button onClick={() => onChange(EMPTY_FILTERS)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-ink" title="ניקוי הסינון" aria-label="ניקוי הסינון">
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex shrink-0 rounded-md border border-stone-300/80 bg-white p-0.5 shadow-xs" role="group" aria-label="תצוגה">
          {(
            [
              ['list', Rows3, 'טבלה'],
              ['grid', LayoutGrid, 'תמונות'],
              ['board', Columns3, 'לוח לפי שלב'],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              onClick={() => onView(v)}
              aria-pressed={view === v}
              title={label}
              data-testid={`view-${v}`}
              className={`flex h-6 w-7 items-center justify-center rounded-[4px] transition ${view === v ? 'bg-stone-100 text-ink' : 'text-stone-400 hover:text-ink'}`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
