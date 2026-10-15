import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { FileText, ImageOff, MousePointerClick } from 'lucide-react';
import type { Comment, Pin, Version } from '../../types';
import { useFileUrl } from '../../hooks/useFileUrl';
import { isPdf } from '../ui/FileThumb';

export interface NumberedPin {
  comment: Comment;
  number: number;
}

interface Props {
  version: Version;
  pins: NumberedPin[];
  activeId: string | null;
  onSelect: (commentId: string | null) => void;
  /** אם מוגדר – קליק על התמונה פותח הערה חדשה במיקום */
  onAddPin?: (pin: Pin, text: string) => void;
  showResolved: boolean;
  /** גובה מקסימלי לתמונה */
  maxH?: string;
  className?: string;
}

/** במת התצוגה: רקע כהה וניטרלי, כדי שהעבודה תהיה במרכז */
export function PreviewPane({ version, pins, activeId, onSelect, onAddPin, showResolved, maxH, className = '' }: Props) {
  const { url, missing } = useFileUrl(version.previewFileUrl);
  const pdf = isPdf(version);
  const [draft, setDraft] = useState<Pin | null>(null);

  useEffect(() => setDraft(null), [version.id]);

  const h = maxH ?? 'max-h-[56vh] lg:max-h-[calc(100vh-17rem)]';

  if (missing) {
    return (
      <Stage className={className}>
        <div className="flex flex-col items-center gap-3 py-24 text-center text-zinc-400">
          <ImageOff className="h-10 w-10" strokeWidth={1.5} />
          <span className="max-w-xs text-sm">הקובץ לא נמצא בדפדפן הזה. כנראה שהמטמון של הדפדפן נוקה.</span>
        </div>
      </Stage>
    );
  }

  if (pdf) {
    return (
      <Stage className={className}>
        {url ? (
          <iframe title={version.previewFileName} src={`${url}#view=FitH`} className="h-[62vh] w-full rounded-lg bg-white shadow-2xl lg:h-[calc(100vh-17rem)]" />
        ) : (
          <FileText className="h-10 w-10 text-zinc-500" />
        )}
        <p className="mt-3 text-center text-xs text-zinc-400">בקבצי PDF אפשר להוסיף הערות כלליות בצד. הצמדה לנקודה זמינה בתמונות.</p>
      </Stage>
    );
  }

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onAddPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDraft({ x: round(((e.clientX - rect.left) / rect.width) * 100), y: round(((e.clientY - rect.top) / rect.height) * 100) });
    onSelect(null);
  };

  const visible = pins.filter((p) => showResolved || !p.comment.resolved || p.comment.id === activeId);

  return (
    <Stage className={className}>
      <div className={`relative inline-block select-none ${onAddPin ? 'cursor-crosshair' : ''}`} onClick={handleClick} data-testid="preview-canvas">
        {url && (
          <img
            src={url}
            alt={version.previewFileName}
            className={`block h-auto w-auto max-w-full ${h} rounded-sm shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]`}
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
              className={`absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] ring-2 ring-white transition duration-150 ${
                active ? 'pin-active z-20 scale-125 bg-brand-600' : comment.resolved ? 'bg-zinc-500/90' : 'bg-rose-500 hover:scale-110'
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
      {onAddPin && !draft && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <MousePointerClick className="h-3.5 w-3.5" />
          לחצו על נקודה בעבודה כדי להשאיר הערה בדיוק שם
        </p>
      )}
    </Stage>
  );
}

function round(n: number) {
  return Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
}

export function Stage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`stage-grid flex min-h-[300px] flex-col items-center justify-center p-4 sm:p-8 ${className}`}>{children}</div>;
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
        className="pin-active absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-2 ring-white"
      >
        {number}
      </span>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          [right ? 'right' : 'left']: `${right ? 100 - pin.x : pin.x}%`,
          [below ? 'top' : 'bottom']: `calc(${below ? pin.y : 100 - pin.y}% + 20px)`,
        }}
        className="anim-pop absolute z-30 w-72 max-w-[78vw] cursor-default rounded-xl bg-white p-3 text-start shadow-pop ring-1 ring-zinc-900/10"
        data-testid="pin-draft"
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-zinc-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{number}</span>
          הערה על הנקודה הזו
        </div>
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
          className="input resize-none"
        />
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400">Enter לשמירה · Esc לביטול</span>
          <div className="flex gap-1.5">
            <button onClick={onCancel} className="h-8 rounded-lg px-3 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100">
              ביטול
            </button>
            <button
              onClick={() => text.trim() && onSave(text.trim())}
              disabled={!text.trim()}
              className="h-8 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-30"
            >
              שמירת הערה
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
