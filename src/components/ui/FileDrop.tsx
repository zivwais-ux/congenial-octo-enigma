import { useEffect, useRef, useState, type DragEvent } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';

export function formatSize(bytes: number) {
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
      <div className="anim-fade overflow-hidden rounded-lg border border-stone-200/80 bg-white">
        {showPreview && (
          <div className="stage-bg flex h-56 items-center justify-center p-5">
            {preview ? (
              <img src={preview} alt="" className="max-h-full max-w-full object-contain shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)]" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-stone-500">
                <FileText className="h-8 w-8" strokeWidth={1.25} />
                <span className="text-xs">תצוגת ה-PDF תופיע במסך העבודה</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Paperclip className="h-4 w-4 shrink-0 text-stone-400" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-ink" dir="ltr">
              {file.name}
            </div>
            <div className="text-xs text-stone-500">{formatSize(file.size)}</div>
          </div>
          <button type="button" onClick={() => input.current?.click()} className="h-7 rounded-md px-2 text-sm text-stone-600 transition hover:bg-stone-100 hover:text-ink">
            החלפה
          </button>
          <button type="button" onClick={() => onChange(null)} className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-ink" aria-label="הסרת הקובץ">
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
        className={`flex w-full flex-col items-center justify-center rounded-lg border border-dashed text-center transition-colors ${compact ? 'px-4 py-5' : 'px-6 py-12'} ${
          over ? 'border-ink bg-stone-100' : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50/60'
        }`}
      >
        <span className="text-base text-ink">
          {over ? (
            'אפשר לשחרר'
          ) : (
            <>
              {title} <span className="text-stone-400">או</span> <span className="underline decoration-stone-300 underline-offset-4">בחירה מהמחשב</span>
            </>
          )}
        </span>
        <span className="mt-1 text-sm text-stone-500">{hint}</span>
      </button>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {hidden}
    </div>
  );
}

export const PREVIEW_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,application/pdf';

export function validatePreview(f: File): string | null {
  const ok = f.type.startsWith('image/') || f.type === 'application/pdf' || /\.(png|jpe?g|webp|svg|pdf)$/i.test(f.name);
  if (!ok) return 'קובץ התצוגה צריך להיות PNG, JPG או PDF. קבצי עבודה (PSD, AI, INDD) מצרפים בשדה "קובץ מקור".';
  if (f.size > 40 * 1024 * 1024) return 'הקובץ גדול מדי להדגמה (עד 40MB).';
  return null;
}

export function validateSource(f: File): string | null {
  if (f.size > 150 * 1024 * 1024) return 'הקובץ גדול מדי להדגמה (עד 150MB).';
  return null;
}

export function mimeOf(f: File) {
  if (f.type) return f.type;
  return /\.pdf$/i.test(f.name) ? 'application/pdf' : 'image/png';
}
