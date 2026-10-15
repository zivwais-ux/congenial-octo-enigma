import { Search, X } from 'lucide-react';
import type { Item, Status } from '../../types';
import { STATUS_META, STATUS_ORDER } from '../../lib/status';
import { useLookups, useStore } from '../../store/StoreProvider';

export interface Filters {
  q: string;
  status: Status | 'all';
  projectId: string | 'all';
}

export const EMPTY_FILTERS: Filters = { q: '', status: 'all', projectId: 'all' };

export function applyFilters(items: Item[], f: Filters, lookups: ReturnType<typeof useLookups>) {
  const q = f.q.trim();
  return items.filter((i) => {
    if (f.status !== 'all' && i.status !== f.status) return false;
    if (f.projectId !== 'all' && i.projectId !== f.projectId) return false;
    if (q) {
      const hay = [
        i.title,
        lookups.projectById.get(i.projectId)?.name,
        lookups.userById.get(i.designerId)?.name,
        lookups.userById.get(i.approverId)?.name,
      ].join(' ');
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function ItemFilters({ value, onChange, counts }: { value: Filters; onChange: (f: Filters) => void; counts: Record<Status, number> }) {
  const { state } = useStore();
  const active = value.q || value.status !== 'all' || value.projectId !== 'all';
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative lg:w-72">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="חיפוש לפי שם, פרויקט או מעצב"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pe-3 ps-9 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
        <Chip active={value.status === 'all'} onClick={() => onChange({ ...value, status: 'all' })}>
          הכל
        </Chip>
        {STATUS_ORDER.map((s) => (
          <Chip key={s} active={value.status === s} onClick={() => onChange({ ...value, status: s })}>
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`} />
            {STATUS_META[s].label}
            <span className="opacity-60">{counts[s]}</span>
          </Chip>
        ))}
      </div>
      <div className="flex items-center gap-2 lg:ms-auto">
        <select
          value={value.projectId}
          onChange={(e) => onChange({ ...value, projectId: e.target.value })}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 lg:flex-none"
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
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
            נקה
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
