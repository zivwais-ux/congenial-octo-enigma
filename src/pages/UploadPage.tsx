import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock3, Send, UserRoundCheck } from 'lucide-react';
import { useStore } from '../store/StoreProvider';
import { createItem } from '../store/actions';
import { saveFile } from '../store/fileStore';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { ChannelTag } from '../components/ui/ChannelTag';
import { EmptyState } from '../components/ui/EmptyState';
import { FileDrop, mimeOf, PREVIEW_ACCEPT, validatePreview, validateSource } from '../components/ui/FileDrop';
import { uid } from '../lib/id';
import { channelOf } from '../lib/status';
import { dueLabel } from '../lib/dates';
import { firstName } from '../lib/copy';

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

const DUE_PRESETS = [
  { label: 'מחר', days: 1 },
  { label: 'בעוד 3 ימים', days: 3 },
  { label: 'בעוד שבוע', days: 7 },
];

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
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={<UserRoundCheck className="h-6 w-6" />}
          title="העלאת עבודות היא בתפקיד המעצבים"
          text="כדי להדגים העלאה, עברו לתצוגה של אחד המעצבים מהתפריט (למשל נועה לוי)."
          action={
            <Link to="/" className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white">
              חזרה לסקירה
            </Link>
          }
        />
      </div>
    );
  }

  const approver = approvers.find((a) => a.id === approverId);
  const project = state.projects.find((p) => p.id === projectId);
  const valid = !!preview && !!title.trim() && !!projectId && !!approverId && !!dueDate;

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
      toast(`נשלח ל${approver?.name} לאישור`, { channel: channelOf(approverId) });
      navigate(`/item/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const pendingFor = (id: string) => state.items.filter((i) => i.approverId === id && i.status === 'pending').length;

  return (
    <div className="anim-rise mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7">
        <h1 className="text-[26px] font-extrabold tracking-tight text-zinc-900 sm:text-3xl">העלאת עבודה לאישור</h1>
        <p className="mt-1.5 text-[15px] text-zinc-500">במקום מייל עם קובץ מצורף: מעלים פעם אחת, והמאשר מקבל התראה לאן שהוא כבר נמצא.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
        <div className="space-y-6">
          <Step n={1} title="הקבצים" subtitle="קובץ תצוגה שהמאשר יראה, וקובץ המקור אם רוצים לשמור אותו יחד">
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
            {tried && !preview && <p className="mt-2 text-xs font-medium text-rose-600">צריך לבחור קובץ תצוגה</p>}
            <div className="mt-3">
              <FileDrop
                file={source}
                onChange={setSource}
                validate={validateSource}
                title="קובץ מקור (לא חובה)"
                hint="PSD, AI, INDD וכו׳ · יישמר יחד עם העבודה וזמין להורדה"
                compact
                testId="source-input"
              />
            </div>
          </Step>

          <Step n={2} title="פרטי העבודה">
            <div className="space-y-4">
              <Field label="שם העבודה" error={tried && !title.trim() ? 'חסר שם לעבודה' : undefined}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='למשל: "באנר ראשי לאתר – ראש השנה"' className="input" data-testid="title-input" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="פרויקט">
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input">
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="דדליין לאישור">
                  <input type="date" value={dueDate} min={plusDays(0)} onChange={(e) => setDueDate(e.target.value)} className="input" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {DUE_PRESETS.map((p) => {
                      const v = plusDays(p.days);
                      return (
                        <button
                          key={p.days}
                          type="button"
                          onClick={() => setDueDate(v)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${dueDate === v ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </div>
          </Step>

          <Step n={3} title="למי לשלוח">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {approvers.map((a) => {
                const selected = approverId === a.id;
                const q = pendingFor(a.id);
                return (
                  <label
                    key={a.id}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      selected ? 'border-zinc-900 bg-white ring-1 ring-zinc-900' : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <input type="radio" name="approver" value={a.id} checked={selected} onChange={() => setApproverId(a.id)} className="sr-only" />
                    <Avatar user={a} size="lg" ring={false} />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block text-sm font-semibold text-zinc-900">{a.name}</span>
                      <span className="block text-xs text-zinc-500">{a.title}</span>
                      <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                        {q === 0 ? 'התור פנוי' : q === 1 ? 'עבודה אחת בתור' : `${q} עבודות בתור`}
                        <span className="text-zinc-300">·</span>
                        <ChannelTag channel={channelOf(a.id)} />
                      </span>
                    </span>
                    {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-900" />}
                  </label>
                );
              })}
            </div>
            <div className="mt-4">
              <Field label="הערה למאשר" hint="לא חובה">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="הקשר, על מה לשים לב, מתי זה יוצא לדפוס…"
                  className="input resize-none"
                />
              </Field>
            </div>
          </Step>
        </div>

        {/* סיכום */}
        <aside className="lg:sticky lg:top-[4.75rem] lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="text-sm font-bold text-zinc-900">מה יקרה כשתשלחו</div>
            </div>
            <ul className="space-y-4 px-5 py-5 text-[13px] text-zinc-600">
              <Outcome icon={<Bell className="h-4 w-4" />}>
                {approver ? (
                  <>
                    התראה תישלח ל<b className="font-semibold text-zinc-900">{approver.name}</b> ב-<ChannelTag channel={channelOf(approver.id)} />
                  </>
                ) : (
                  'המאשר יקבל התראה'
                )}
              </Outcome>
              <Outcome icon={<Clock3 className="h-4 w-4" />}>
                העבודה תופיע בתור של {approver ? firstName(approver.name) : 'המאשר'}, עם דדליין <b className="font-semibold text-zinc-900">{dueLabel(dueDate)}</b>
              </Outcome>
              <Outcome icon={<CheckCircle2 className="h-4 w-4" />}>
                ההערות יגיעו אליך ישירות על התמונה{project ? `, ובסוף העבודה תישמר בארכיון "${project.name}"` : ''}
              </Outcome>
            </ul>
            <div className="border-t border-zinc-100 bg-zinc-50/70 p-4">
              <Button type="submit" variant="brand" size="lg" block loading={busy} icon={<Send className="h-4 w-4 -scale-x-100" />} data-testid="submit-upload">
                שליחה לאישור
              </Button>
              {tried && !valid && <p className="mt-2 text-center text-xs font-medium text-rose-600">חסרים פרטים בטופס</p>}
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Step({ n, title, subtitle, children }: { n: number; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">{n}</span>
        <div>
          <h2 className="text-[15px] font-bold leading-6 text-zinc-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-zinc-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Outcome({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">{icon}</span>
      <span className="pt-1 leading-relaxed">{children}</span>
    </li>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[13px] font-semibold text-zinc-800">{label}</span>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
