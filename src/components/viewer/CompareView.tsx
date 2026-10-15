import { useRef, useState, type PointerEvent } from 'react';
import { Columns2, SplitSquareHorizontal } from 'lucide-react';
import type { Comment, Item, Version } from '../../types';
import { formatDate } from '../../lib/dates';
import { useFileUrl } from '../../hooks/useFileUrl';
import { isPdf } from '../ui/FileThumb';
import { PreviewPane, Stage, type NumberedPin } from './PreviewPane';

function pinsFor(comments: Comment[], versionId: string): NumberedPin[] {
  return comments
    .filter((c) => c.versionId === versionId && c.pin)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((comment, i) => ({ comment, number: i + 1 }));
}

/** השוואת שתי גרסאות: זו לצד זו, או "תריס" שגוררים מעל התמונה */
export function CompareView({ item, comments }: { item: Item; comments: Comment[] }) {
  const n = item.versions.length;
  const [beforeId, setBeforeId] = useState(item.versions[n - 2].id);
  const [afterId, setAfterId] = useState(item.versions[n - 1].id);
  const [mode, setMode] = useState<'side' | 'swipe'>('side');
  const [showPins, setShowPins] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const before = item.versions.find((v) => v.id === beforeId)!;
  const after = item.versions.find((v) => v.id === afterId)!;
  const canSwipe = !isPdf(before) && !isPdf(after);

  const picker = (value: string, onChange: (v: string) => void, label: string) => (
    <label className="flex items-center gap-2 text-xs text-stone-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 rounded-md border border-white/10 bg-white/[0.06] px-2 text-[12px] text-stone-100 focus:outline-none"
      >
        {item.versions.map((x) => (
          <option key={x.id} value={x.id} className="text-ink">
            גרסה {x.number} · {formatDate(x.uploadedAt)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-stage-line bg-stage-deep px-3 py-2">
        <div className="flex rounded-md bg-white/[0.06] p-0.5">
          {(
            [
              ['side', Columns2, 'זו לצד זו'],
              ['swipe', SplitSquareHorizontal, 'תריס'],
            ] as const
          ).map(([m, Icon, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={m === 'swipe' && !canSwipe}
              className={`flex h-6 items-center gap-1.5 rounded px-2 text-[12px] transition disabled:opacity-30 ${
                mode === m ? 'bg-white/[0.14] text-white' : 'text-stone-400 hover:text-stone-100'
              }`}
              data-testid={`compare-mode-${m}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        {picker(beforeId, setBeforeId, 'לפני')}
        {picker(afterId, setAfterId, 'אחרי')}
        {mode === 'side' && (
          <label className="ms-auto flex cursor-pointer items-center gap-2 text-xs text-stone-500">
            <input type="checkbox" checked={showPins} onChange={(e) => setShowPins(e.target.checked)} className="h-3.5 w-3.5 accent-white" />
            הערות מסומנות
          </label>
        )}
      </div>

      {mode === 'side' || !canSwipe ? (
        <div className="grid gap-px bg-stage-line md:grid-cols-2">
          {[before, after].map((v, i) => (
            <div key={i} className="relative" data-testid="compare-side">
              <span className="absolute start-3 top-3 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-stone-100">
                {i === 0 ? 'לפני' : 'אחרי'} · גרסה {v.number}
              </span>
              <PreviewPane
                version={v}
                pins={showPins ? pinsFor(comments, v.id) : []}
                activeId={active}
                onSelect={setActive}
                showResolved
                maxH="max-h-[40vh] lg:max-h-[calc(100vh-21rem)]"
              />
              {v.note && <p className="border-t border-stage-line bg-stage-deep px-4 py-2.5 text-xs leading-5 text-stone-400">{v.note}</p>}
            </div>
          ))}
        </div>
      ) : (
        <Swipe before={before} after={after} />
      )}
    </div>
  );
}

function Swipe({ before, after }: { before: Version; after: Version }) {
  const a = useFileUrl(before.previewFileUrl).url;
  const b = useFileUrl(after.previewFileUrl).url;
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (e: PointerEvent) => {
    if (!dragging.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <Stage>
      <div
        ref={ref}
        className="relative inline-block cursor-ew-resize touch-none select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        onPointerUp={() => (dragging.current = false)}
        data-testid="swipe"
      >
        {/* "לפני" ברקע, "אחרי" נחשף מימין לקו – כמו בכיוון הקריאה */}
        {a && <img src={a} alt="" className="block h-auto max-h-[52vh] w-auto max-w-full shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] lg:max-h-[calc(100vh-19rem)]" draggable={false} />}
        {b && (
          <img
            src={b}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
            draggable={false}
          />
        )}
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-lg">
            <SplitSquareHorizontal className="h-4 w-4" />
          </span>
        </div>
        <span className="pointer-events-none absolute start-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">אחרי · גרסה {after.number}</span>
        <span className="pointer-events-none absolute end-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-white">לפני · גרסה {before.number}</span>
      </div>
      <p className="mt-5 text-xs text-stone-500">גוררים את הקו כדי לחשוף את ההבדלים</p>
    </Stage>
  );
}
