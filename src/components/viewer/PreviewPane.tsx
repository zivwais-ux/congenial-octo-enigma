import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { FileText, ImageOff } from 'lucide-react';
import type { Comment, Pin, Version } from '../../types';
import { useFileUrl } from '../../hooks/useFileUrl';
import { isPdf } from '../ui/FileThumb';

export interface NumberedPin {
  comment: Comment;
  number: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

interface Props {
  version: Version;
  pins: NumberedPin[];
  activeId: string | null;
  onSelect: (commentId: string | null) => void;
  /** אם מוגדר – קליק על העבודה פותח הערה חדשה במיקום */
  onAddPin?: (pin: Pin, text: string) => void;
  showResolved: boolean;
  /** גובה מקסימלי לתמונה (במצב "התאמה למסך") */
  maxH?: string;
  className?: string;
  /** זום ביחס להתאמה למסך: 1 = התאמה, 2 = פי 2 וכו׳ */
  zoom?: number;
  onZoom?: (z: number) => void;
  /** מדווח כמה זום שווה ל-100% (גודל הקובץ האמיתי) */
  onActualSize?: (z: number) => void;
}

/** במת התצוגה: רקע כהה וניטרלי, כדי שהעבודה תהיה במרכז. תומכת בזום, גרירה וצביטה */
export function PreviewPane({ version, pins, activeId, onSelect, onAddPin, showResolved, maxH, className = '', zoom = 1, onZoom, onActualSize }: Props) {
  const { url, missing } = useFileUrl(version.previewFileUrl);
  const pdf = isPdf(version);
  const [draft, setDraft] = useState<Pin | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const baseWidth = useRef(0);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const zoomed = zoom > 1.001 && baseWidth.current > 0;

  useEffect(() => setDraft(null), [version.id]);

  // מודדים את רוחב התמונה ב"התאמה למסך" – הבסיס לחישוב הזום
  const measure = () => {
    const img = imgRef.current;
    if (!img || zoomRef.current > 1.001) return;
    const w = img.getBoundingClientRect().width;
    if (!w) return;
    baseWidth.current = w;
    if (img.naturalWidth) onActualSize?.(Math.max(1, img.naturalWidth / w));
  };
  useLayoutEffect(measure);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });

  // Ctrl/⌘ + גלגלת = זום (מאזין לא-פסיבי כדי לבטל את הזום של הדפדפן)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !onZoom) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      onZoom(clampZoom(zoomRef.current * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onZoom, url]);

  // גרירה (כשמוגדל) וצביטה (שתי אצבעות). תזוזה קטנה נחשבת קליק
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef({ moved: false, startDist: 0, startZoom: 1 });
  const scroller = () => canvasRef.current?.closest('[data-stage-scroll]') as HTMLElement | null;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag.current.moved = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      drag.current.startDist = Math.hypot(a.x - b.x, a.y - b.y);
      drag.current.startZoom = zoomRef.current;
    }
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && onZoom && drag.current.startDist) {
      const [a, b] = [...pointers.current.values()];
      drag.current.moved = true;
      onZoom(clampZoom((drag.current.startZoom * Math.hypot(a.x - b.x, a.y - b.y)) / drag.current.startDist));
      return;
    }
    if (zoomRef.current > 1.001 && e.buttons) {
      if (Math.abs(dx) + Math.abs(dy) > 0) {
        const s = scroller();
        if (s) {
          s.scrollLeft -= dx;
          s.scrollTop -= dy;
        }
      }
    }
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) drag.current.startDist = 0;
  };
  // סך התזוזה מאז הלחיצה קובע אם זו גרירה או קליק
  const downAt = useRef<{ x: number; y: number } | null>(null);

  const h = maxH ?? 'max-h-[52vh] lg:max-h-[calc(100vh-17.5rem)]';

  if (missing) {
    return (
      <Stage className={className}>
        <div className="flex flex-col items-center gap-3 py-24 text-center text-stone-500">
          <ImageOff className="h-8 w-8" strokeWidth={1.25} />
          <span className="max-w-xs text-sm">הקובץ לא נמצא בדפדפן הזה. כנראה שהמטמון נוקה.</span>
        </div>
      </Stage>
    );
  }

  if (pdf) {
    return (
      <Stage className={className}>
        {url ? <iframe title={version.previewFileName} src={`${url}#view=FitH`} className="h-[60vh] w-full max-w-4xl bg-white lg:h-[calc(100vh-17.5rem)]" /> : <FileText className="h-8 w-8 text-stone-500" />}
        <p className="mt-3 text-xs text-stone-500">בקבצי PDF ההערות נכתבות בפאנל. סימון על נקודה זמין בתמונות.</p>
      </Stage>
    );
  }

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const start = downAt.current;
    downAt.current = null;
    if (drag.current.moved || (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4)) return;
    if (!onAddPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDraft({ x: round(((e.clientX - rect.left) / rect.width) * 100), y: round(((e.clientY - rect.top) / rect.height) * 100) });
    onSelect(null);
  };

  const visible = pins.filter((p) => showResolved || !p.comment.resolved || p.comment.id === activeId);
  const cursor = zoomed ? 'cursor-grab active:cursor-grabbing' : onAddPin ? 'cursor-crosshair' : '';

  return (
    <Stage className={className}>
      <div
        ref={canvasRef}
        className={`relative inline-block shrink-0 select-none ${cursor}`}
        style={{ touchAction: zoomed ? 'none' : 'pan-x pan-y' }}
        onClick={handleClick}
        onPointerDown={(e) => {
          downAt.current = { x: e.clientX, y: e.clientY };
          onPointerDown(e);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-testid="preview-canvas"
      >
        {url && (
          <img
            ref={imgRef}
            src={url}
            alt={version.previewFileName}
            onLoad={measure}
            className={`block h-auto ${zoomed ? '' : `w-auto max-w-full ${h}`} shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]`}
            style={zoomed ? { width: baseWidth.current * zoom, maxWidth: 'none', maxHeight: 'none' } : undefined}
            draggable={false}
          />
        )}
        {visible.map(({ comment, number }) => {
          const active = comment.id === activeId;
          return (
            <button
              key={comment.id}
              type="button"
              data-testid="pin"
              onClick={(e) => {
                e.stopPropagation();
                setDraft(null);
                onSelect(active ? null : comment.id);
              }}
              style={{ left: `${comment.pin!.x}%`, top: `${comment.pin!.y}%` }}
              className={`num absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.4)] ring-[1.5px] ring-white transition duration-150 ${
                active ? 'pin-active z-20 scale-[1.2] bg-signal-500 text-white' : comment.resolved ? 'bg-stone-500 text-white/90' : 'bg-signal-500 text-white hover:scale-110'
              }`}
              title={comment.text}
              aria-label={`הערה ${number}: ${comment.text}`}
            >
              {number}
            </button>
          );
        })}
        {draft && onAddPin && (
          <DraftPin
            pin={draft}
            number={pins.length + 1}
            onCancel={() => setDraft(null)}
            onSave={(text) => {
              onAddPin(draft, text);
              setDraft(null);
            }}
          />
        )}
      </div>
      {onAddPin && !draft && !zoomed && <p className="mt-5 text-center text-xs text-stone-500">לחיצה על נקודה בעבודה משאירה הערה בדיוק שם</p>}
      {zoomed && <p className="mt-4 text-center text-xs text-stone-500">גוררים כדי לזוז בעבודה · קליק בלי גרירה משאיר הערה</p>}
    </Stage>
  );
}

function round(n: number) {
  return Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
}

export function Stage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  // m-auto במקום מרכוז ב-flex: כשהתמונה מוגדלת אפשר לגלול לכל הקצוות שלה
  return (
    <div className={`stage-bg flex min-h-[300px] p-5 sm:p-8 ${className}`}>
      <div className="m-auto flex flex-col items-center">{children}</div>
    </div>
  );
}

function DraftPin({ pin, number, onSave, onCancel }: { pin: Pin; number: number; onSave: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);

  // הבועה נפתחת לצד שיש בו יותר מקום
  const right = pin.x > 50;
  const below = pin.y < 62;

  return (
    <>
      <span
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        className="num pin-active absolute z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-signal-500 text-[11px] font-semibold text-white ring-[1.5px] ring-white"
      >
        {number}
      </span>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          [right ? 'right' : 'left']: `${right ? 100 - pin.x : pin.x}%`,
          [below ? 'top' : 'bottom']: `calc(${below ? pin.y : 100 - pin.y}% + 18px)`,
        }}
        className="anim-pop absolute z-30 w-72 max-w-[78vw] cursor-default overflow-hidden rounded-lg bg-white text-start shadow-pop"
        data-testid="pin-draft"
      >
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
              e.preventDefault();
              onSave(text.trim());
            }
            if (e.key === 'Escape') onCancel();
          }}
          rows={3}
          placeholder="מה צריך לשנות כאן?"
          className="block w-full resize-none border-0 px-3 pt-3 text-base text-ink placeholder:text-stone-400 focus:outline-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2 border-t border-stone-100 px-2 py-2">
          <span className="ps-1 text-xs text-stone-400">הערה {number}</span>
          <div className="flex gap-1">
            <button onClick={onCancel} className="h-7 rounded-md px-2.5 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-ink">
              ביטול
            </button>
            <button
              onClick={() => text.trim() && onSave(text.trim())}
              disabled={!text.trim()}
              className="h-7 rounded-md bg-ink px-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-30"
            >
              שמירה
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
