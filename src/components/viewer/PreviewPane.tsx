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
  compact?: boolean;
}

export function PreviewPane({ version, pins, activeId, onSelect, onAddPin, showResolved, compact }: Props) {
  const { url, missing } = useFileUrl(version.previewFileUrl);
  const pdf = isPdf(version);
  const [draft, setDraft] = useState<Pin | null>(null);

  useEffect(() => setDraft(null), [version.id]);

  const maxH = compact ? 'max-h-[60vh]' : 'max-h-[58vh] lg:max-h-[calc(100vh-19rem)]';

  if (missing) {
    return (
      <Frame>
        <div className="flex flex-col items-center gap-2 py-20 text-slate-400">
          <ImageOff className="h-10 w-10" />
          <span className="text-sm">הקובץ לא נמצא בדפדפן הזה (אולי נמחק מהמטמון)</span>
        </div>
      </Frame>
    );
  }

  if (pdf) {
    return (
      <Frame>
        {url ? (
          <iframe title={version.previewFileName} src={`${url}#view=FitH`} className="h-[65vh] w-full rounded-lg bg-white lg:h-[calc(100vh-15rem)]" />
        ) : (
          <FileText className="h-10 w-10 text-slate-300" />
        )}
        <p className="mt-2 text-center text-xs text-slate-500">בקובץ PDF אפשר להוסיף הערות כלליות בלבד (בלי הצמדה לנקודה)</p>
      </Frame>
    );
  }

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onAddPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDraft({ x: round(x), y: round(y) });
    onSelect(null);
  };

  const visible = pins.filter((p) => showResolved || !p.comment.resolved || p.comment.id === activeId);

  return (
    <Frame>
      <div
        className={`relative inline-block select-none ${onAddPin ? 'cursor-crosshair' : ''}`}
        onClick={handleClick}
        data-testid="preview-canvas"
      >
        {url && <img src={url} alt={version.previewFileName} className={`block h-auto w-auto max-w-full ${maxH} rounded shadow-sm`} draggable={false} />}
        {visible.map(({ comment, number }) => (
          <button
            key={comment.id}
            type="button"
            data-testid="pin"
            onClick={(e) => {
              e.stopPropagation();
              setDraft(null);
              onSelect(comment.id === activeId ? null : comment.id);
            }}
            style={{ left: `${comment.pin!.x}%`, top: `${comment.pin!.y}%` }}
            className={`absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-md transition ${
              comment.id === activeId
                ? 'pin-active z-20 scale-125 bg-brand-600 text-white'
                : comment.resolved
                  ? 'bg-slate-400 text-white opacity-80'
                  : 'bg-rose-500 text-white hover:scale-110'
            }`}
            title={comment.text}
          >
            {number}
          </button>
        ))}
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
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <MousePointerClick className="h-3.5 w-3.5" />
          לחצו על נקודה בתמונה כדי להצמיד הערה
        </p>
      )}
    </Frame>
  );
}

function round(n: number) {
  return Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl bg-[#e9ebef] p-3 sm:p-6" style={{ backgroundImage: 'radial-gradient(#d5d9e0 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
      {children}
    </div>
  );
}

function DraftPin({ pin, number, onSave, onCancel }: { pin: Pin; number: number; onSave: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);

  // הבועה נפתחת לכיוון שיש בו יותר מקום
  const right = pin.x > 50;
  const below = pin.y < 65;

  return (
    <>
      <span
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        className="pin-active absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-xs font-bold text-white shadow-md"
      >
        {number}
      </span>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          [right ? 'right' : 'left']: `${right ? 100 - pin.x : pin.x}%`,
          [below ? 'top' : 'bottom']: `calc(${below ? pin.y : 100 - pin.y}% + 18px)`,
        }}
        className="absolute z-30 w-64 max-w-[80vw] cursor-default rounded-xl border border-slate-200 bg-white p-2.5 text-start shadow-xl"
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
          rows={2}
          placeholder="מה צריך לשנות כאן?"
          className="w-full resize-none rounded-lg border border-slate-200 p-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-2 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100">
            ביטול
          </button>
          <button
            onClick={() => text.trim() && onSave(text.trim())}
            disabled={!text.trim()}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
          >
            שמירת הערה
          </button>
        </div>
      </div>
    </>
  );
}
