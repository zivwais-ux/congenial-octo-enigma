import type { Version } from '../../types';
import { formatDate } from '../../lib/dates';

/** מעבר בין גרסאות, על סרגל הבמה הכהה */
export function VersionTabs({ versions, value, onChange }: { versions: Version[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="no-scrollbar flex items-center gap-0.5 overflow-x-auto" role="tablist" aria-label="גרסאות">
      {[...versions].reverse().map((v, i) => {
        const active = v.id === value;
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v.id)}
            className={`flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 font-mono text-[12px] transition ${active ? 'bg-white/[0.12] text-white' : 'text-stone-400 hover:bg-white/[0.06] hover:text-stone-100'}`}
            title={`הועלתה ב-${formatDate(v.uploadedAt)}`}
          >
            <span dir="ltr">v{v.number}</span>
            {i === 0 && <span className="font-sans text-[11px] text-stone-500">אחרונה</span>}
          </button>
        );
      })}
    </div>
  );
}
