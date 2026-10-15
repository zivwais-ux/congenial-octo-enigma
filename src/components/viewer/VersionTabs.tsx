import type { Version } from '../../types';
import { formatDate } from '../../lib/dates';

export function VersionTabs({ versions, value, onChange }: { versions: Version[]; value: string; onChange: (id: string) => void }) {
  const latest = versions[versions.length - 1];
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1" role="tablist" aria-label="גרסאות">
      {[...versions].reverse().map((v) => (
        <button
          key={v.id}
          role="tab"
          aria-selected={v.id === value}
          onClick={() => onChange(v.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            v.id === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
          title={`הועלתה ${formatDate(v.uploadedAt)}`}
        >
          v{v.number}
          {v.id === latest.id && <span className="rounded bg-brand-50 px-1 text-[10px] font-semibold text-brand-700">נוכחית</span>}
        </button>
      ))}
    </div>
  );
}
