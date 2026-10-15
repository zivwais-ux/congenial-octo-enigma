import { useEffect, useRef, useState, type DragEvent } from 'react';
import { FileImage, FileText, Paperclip, RefreshCw, UploadCloud, X } from 'lucide-react';

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
    const isImg = file.type.startsWith('image/');
    return (
      <div className="anim-fade overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card">
        {showPreview && (
          <div className="stage-grid flex h-60 items-center justify-center p-4">
            {preview ? (
              <img src={preview} alt="" className="max-h-full max-w-full rounded-sm object-contain shadow-[0_12px_30px_-8px_rgba(0,0,0,0.6)]" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <FileText className="h-10 w-10" strokeWidth={1.5} />
                <span className="text-xs">תצוגה מקדימה של PDF תופיע במסך העבודה</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
            {isImg ? <FileImage className="h-4 w-4" /> : showPreview ? <FileText className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-zinc-900" dir="auto">
              {file.name}
            </div>
            <div className="text-xs text-zinc-500">{formatSize(file.size)} · מוכן לשליחה</div>
          </div>
          <button type="button" onClick={() => input.current?.click()} className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100">
            <RefreshCw className="h-3.5 w-3.5" />
            החלפה
          </button>
          <button type="button" onClick={() => onChange(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="הסרת הקובץ">
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
        className={`group flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition ${compact ? 'px-4 py-5' : 'px-6 py-14'} ${
          over ? 'scale-[1.01] border-brand-500 bg-brand-50' : 'border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50/80'
        }`}
      >
        <span
          className={`flex items-center justify-center rounded-2xl transition ${compact ? 'h-9 w-9' : 'h-14 w-14'} ${
            over ? 'bg-brand-600 text-white' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white'
          }`}
        >
          <UploadCloud className={compact ? 'h-4 w-4' : 'h-6 w-6'} />
        </span>
        <span className={`font-semibold text-zinc-900 ${compact ? 'text-sm' : 'text-[15px]'}`}>{over ? 'אפשר לשחרר' : title}</span>
        <span className="text-xs text-zinc-500">{hint}</span>
      </button>
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
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
