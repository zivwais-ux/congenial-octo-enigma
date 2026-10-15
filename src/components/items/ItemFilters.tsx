import { LayoutGrid, List, Search, X } from 'lucide-react';
import type { Item, Status } from '../../types';
import { STATUS_META, STATUS_ORDER } from '../../lib/status';
import { useLookups, useStore } from '../../store/StoreProvider';

export interface Filters {
  q: string;
  status: Status | 'all';
  projectId: string | 'all';
}

export const EMPTY_FILTERS: Filters = { q: '', status: 'all', projectId: 'all' };

export type View = 'grid' | 'list';

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
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex shrink-0 gap-0.5 rounded-xl bg-zinc-200/60 p-1">
          <Seg active={value.status === 'all'} onClick={() => onChange({ ...value, status: 'all' })}>
            הכל <span className="opacity-50">{total}</span>
          </Seg>
          {STATUS_ORDER.map((s) => (
            <Seg key={s} active={value.status === s} onClick={() => onChange({ ...value, status: s })}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}
              <span className="opacity-50">{counts[s]}</span>
            </Seg>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 xl:ms-auto">
        <div className="relative min-w-0 flex-1 xl:w-64 xl:flex-none">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            placeholder="סינון לפי שם, פרויקט או מעצב"
            className="input h-9 py-0 ps-9"
            aria-label="סינון"
          />
        </div>
        <select
          value={value.projectId}
          onChange={(e) => onChange({ ...value, projectId: e.target.value })}
          className="input h-9 w-auto max-w-[11rem] py-0"
          aria-label="סינון לפי פרויקט"
        >
          <option value="all">כל הפרויקטים</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {active && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">ניקוי</span>
          </button>
        )}
        <div className="flex shrink-0 rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm shadow-zinc-900/[0.02]" role="group" aria-label="תצוגה">
          {(
            [
              ['grid', LayoutGrid, 'כרטיסים'],
              ['list', List, 'רשימה'],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              onClick={() => onView(v)}
              aria-pressed={view === v}
              title={label}
              className={`flex h-7 w-8 items-center justify-center rounded-md transition ${view === v ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700'}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
        active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
      }`}
    >
      {children}
    </button>
  );
}
