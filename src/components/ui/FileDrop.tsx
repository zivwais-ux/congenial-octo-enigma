import { useEffect, useRef, useState, type DragEvent } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  file: File | null;
  onChange: (f: File | null) => void;
  accept?: string;
  /** מחזיר הודעת שגיאה אם הקובץ לא מתאים */
  validate?: (f: File) => string | null;
  title: string;
  hint: string;
  showPreview?: boolean;
  compact?: boolean;
  testId?: string;
}

export function FileDrop({ file, onChange, accept, validate, title, hint, showPreview, compact, testId }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !showPreview || !file.type.startsWith('image/')) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, showPreview]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const err = validate?.(f) ?? null;
    setError(err);
    if (!err) onChange(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    pick(e.dataTransfer.files[0]);
  };

  const hidden = (
    <input
      ref={input}
      type="file"
      accept={accept}
      className="hidden"
      data-testid={testId}
      onChange={(e) => {
        pick(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );

  if (file) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {showPreview && (
          <div className="flex h-56 items-center justify-center bg-slate-100 p-3">
            {preview ? (
              <img src={preview} alt="" className="max-h-full max-w-full rounded object-contain shadow-sm" />
            ) : (
              <FileText className="h-12 w-12 text-slate-400" />
            )}
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <FileText className="h-5 w-5 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-800" dir="auto">
              {file.name}
            </div>
            <div className="text-xs text-slate-500">{formatSize(file.size)}</div>
          </div>
          <button type="button" onClick={() => input.current?.click()} className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">
            החלפה
          </button>
          <button type="button" onClick={() => onChange(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="הסרת קובץ">
            <X className="h-4 w-4" />
          </button>
        </div>
        {hidden}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition ${
          compact ? 'px-4 py-5' : 'px-4 py-10'
        } ${over ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
      >
        <UploadCloud className={`${compact ? 'h-6 w-6' : 'h-9 w-9'} ${over ? 'text-brand-600' : 'text-slate-400'}`} />
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </button>
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      {hidden}
    </div>
  );
}

export const PREVIEW_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,application/pdf';

export function validatePreview(f: File): string | null {
  const ok = f.type.startsWith('image/') || f.type === 'application/pdf' || /\.(png|jpe?g|webp|svg|pdf)$/i.test(f.name);
  if (!ok) return 'קובץ התצוגה צריך להיות PNG, JPG או PDF. קבצי מקור (PSD, AI…) מעלים בשדה השני.';
  if (f.size > 40 * 1024 * 1024) return 'הקובץ גדול מדי לדמו (מעל 40MB)';
  return null;
}

export function validateSource(f: File): string | null {
  if (f.size > 150 * 1024 * 1024) return 'הקובץ גדול מדי לדמו (מעל 150MB)';
  return null;
}

export function mimeOf(f: File) {
  if (f.type) return f.type;
  return /\.pdf$/i.test(f.name) ? 'application/pdf' : 'image/png';
}
