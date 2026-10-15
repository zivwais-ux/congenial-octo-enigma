import type { Version } from '../../types';
import { formatDate } from '../../lib/dates';

/** מעבר בין גרסאות – בסגנון כהה, על סרגל הבמה */
export function VersionTabs({ versions, value, onChange }: { versions: Version[]; value: string; onChange: (id: string) => void }) {
  const latest = versions[versions.length - 1];
  return (
    <div className="no-scrollbar flex gap-0.5 overflow-x-auto rounded-lg bg-white/[0.06] p-0.5" role="tablist" aria-label="גרסאות">
      {[...versions].reverse().map((v) => {
        const active = v.id === value;
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-semibold transition ${
              active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
            }`}
            title={`הועלתה ב-${formatDate(v.uploadedAt)}`}
          >
            <span dir="ltr">v{v.number}</span>
            {v.id === latest.id && <span className={`text-[10px] font-medium ${active ? 'text-brand-600' : 'text-zinc-500'}`}>נוכחית</span>}
          </button>
        );
      })}
    </div>
  );
}
