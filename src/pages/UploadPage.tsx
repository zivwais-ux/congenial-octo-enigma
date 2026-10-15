import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Send } from 'lucide-react';
import { useStore } from '../store/StoreProvider';
import { createItem } from '../store/actions';
import { saveFile } from '../store/fileStore';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { FileDrop, mimeOf, PREVIEW_ACCEPT, validatePreview, validateSource } from '../components/ui/FileDrop';
import { uid } from '../lib/id';
import { USER_CHANNEL } from '../lib/status';

function plusDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function titleFromFile(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

export function UploadPage() {
  const { state, update, currentUser } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const approvers = state.users.filter((u) => u.role === 'approver');

  const [preview, setPreview] = useState<File | null>(null);
  const [source, setSource] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? '');
  const [approverId, setApproverId] = useState(approvers[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(plusDays(3));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  if (currentUser.role !== 'designer') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">העלאת עבודות זמינה למעצבים</h1>
        <p className="mt-2 text-sm text-slate-500">החליפו למשתמש מעצב מהתפריט למעלה כדי להדגים העלאה.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
          חזרה לדשבורד
        </Link>
      </div>
    );
  }

  const valid = !!preview && title.trim() && projectId && approverId && dueDate;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || !preview) return;
    setBusy(true);
    try {
      const previewUrl = await saveFile(preview);
      const sourceUrl = source ? await saveFile(source) : undefined;
      const id = uid('i');
      update(
        (s) =>
          createItem(s, {
            id,
            title: title.trim(),
            projectId,
            approverId,
            dueDate,
            note: note.trim(),
            preview: { url: previewUrl, name: preview.name, mime: mimeOf(preview) },
            source: source && sourceUrl ? { url: sourceUrl, name: source.name } : undefined,
          }).state,
      );
      const approver = state.users.find((u) => u.id === approverId);
      toast(`נשלח ל${approver?.name} לאישור · התראה ב-${USER_CHANNEL[approverId] ?? 'מייל'}`);
      navigate(`/item/${id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowRight className="h-4 w-4" />
        חזרה
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">העלאת עבודה לאישור</h1>
      <p className="mt-1 text-sm text-slate-500">במקום מייל עם קובץ מצורף: מעלים פעם אחת, והמאשר מקבל התראה.</p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Field label="קובץ תצוגה" required error={tried && !preview ? 'צריך לבחור קובץ תצוגה' : undefined}>
            <FileDrop
              file={preview}
              onChange={(f) => {
                setPreview(f);
                if (f && !title) setTitle(titleFromFile(f.name));
              }}
              accept={PREVIEW_ACCEPT}
              validate={validatePreview}
              title="גררו לכאן את קובץ התצוגה"
              hint="PNG, JPG או PDF · או לחצו לבחירה מהמחשב"
              showPreview
              testId="preview-input"
            />
          </Field>
          <Field label="קובץ מקור" hint="אופציונלי · PSD, AI, INDD וכו׳. המאשר והצוות יוכלו להוריד אותו">
            <FileDrop
              file={source}
              onChange={setSource}
              validate={validateSource}
              title="גררו לכאן קובץ מקור"
              hint="או לחצו לבחירה"
              compact
              testId="source-input"
            />
          </Field>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <Field label="שם העבודה" required error={tried && !title.trim() ? 'חסר שם' : undefined}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='למשל "באנר ראשי לאתר – ראש השנה"'
              className={inputCls}
              data-testid="title-input"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="פרויקט" required>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="דדליין" required>
              <input type="date" value={dueDate} min={plusDays(0)} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="מאשר/ת" required>
            <div className="grid gap-2 sm:grid-cols-2">
              {approvers.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition ${
                    approverId === a.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" name="approver" value={a.id} checked={approverId === a.id} onChange={() => setApproverId(a.id)} className="sr-only" />
                  <Avatar user={a} />
                  <span className="leading-tight">
                    <span className="block text-sm font-medium text-slate-900">{a.name}</span>
                    <span className="block text-[11px] text-slate-500">{a.title}</span>
                  </span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="הערה למאשר" hint="אופציונלי">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="הקשר, מה חשוב לבדוק, מתי יוצא לדפוס…"
              className={`${inputCls} resize-none`}
            />
          </Field>
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
            data-testid="submit-upload"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 -scale-x-100" />}
            שליחה לאישור
          </button>
        </div>
      </form>
    </div>
  );
}

export const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

export function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="shrink-0 text-sm font-medium text-slate-800">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
