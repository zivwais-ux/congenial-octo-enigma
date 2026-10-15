import { useState } from 'react';
import type { Comment, Item } from '../../types';
import { formatDate } from '../../lib/dates';
import { PreviewPane, type NumberedPin } from './PreviewPane';

function pinsFor(comments: Comment[], versionId: string): NumberedPin[] {
  return comments
    .filter((c) => c.versionId === versionId && c.pin)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((comment, i) => ({ comment, number: i + 1 }));
}

/** השוואת שתי גרסאות זו לצד זו (במובייל – אחת מעל השנייה) */
export function CompareView({ item, comments }: { item: Item; comments: Comment[] }) {
  const n = item.versions.length;
  const [leftId, setLeftId] = useState(item.versions[n - 2].id);
  const [rightId, setRightId] = useState(item.versions[n - 1].id);
  const [showPins, setShowPins] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  const side = (id: string, setId: (v: string) => void, label: string) => {
    const v = item.versions.find((x) => x.id === id)!;
    return (
      <div className="min-w-0 space-y-2" data-testid="compare-side">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500">{label}</span>
          <select
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {item.versions.map((x) => (
              <option key={x.id} value={x.id}>
                גרסה {x.number} · {formatDate(x.uploadedAt)}
              </option>
            ))}
          </select>
        </div>
        <PreviewPane version={v} pins={showPins ? pinsFor(comments, v.id) : []} activeId={active} onSelect={setActive} showResolved compact />
        {v.note && <p className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">{v.note}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={showPins} onChange={(e) => setShowPins(e.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300" />
        הצג הערות מוצמדות
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        {/* ב-RTL הצד הראשון מוצג מימין: הגרסה הקודמת מימין, החדשה משמאל */}
        {side(leftId, setLeftId, 'לפני')}
        {side(rightId, setRightId, 'אחרי')}
      </div>
    </div>
  );
}
