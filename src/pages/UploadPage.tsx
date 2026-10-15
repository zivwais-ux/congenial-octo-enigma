import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, FileImage, MessageSquarePlus, Paperclip, PenLine, Send, Upload, type LucideIcon } from 'lucide-react';
import { IconTile } from '../components/ui/IconTile';
import type { Tone } from '../lib/status';
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
import { PageHeader } from './DashboardPage';

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

const FLOW: { icon: LucideIcon; tone: Tone; title: string; text: string }[] = [
  { icon: Upload, tone: 'signal', title: 'מעלים קובץ', text: 'תצוגה, ואם רוצים גם מקור' },
  { icon: Bell, tone: 'sky', title: 'התראה למאשר', text: 'מייל, Teams או וואטסאפ' },
  { icon: MessageSquarePlus, tone: 'amber', title: 'הערות על הפיקסל', text: 'ישירות על העבודה' },
  { icon: CheckCheck, tone: 'emerald', title: 'אישור וארכיון', text: 'כל הגרסאות במקום אחד' },
];

const DUE_PRESETS = [
  { label: 'מחר', days: 1 },
  { label: '3 ימים', days: 3 },
  { label: 'שבוע', days: 7 },
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
          title="העלאת עבודות זמינה למעצבים"
          text="כדי להדגים העלאה, עוברים לתצוגה של אחד המעצבים (למשל נועה לוי) מתפריט המשתמש."
          action={
            <Link to="/" className="inline-flex h-9 items-center rounded-md bg-ink px-3.5 text-base font-medium text-white">
              חזרה לרשימה
            </Link>
          }
        />
      </div>
    );
  }

  const approver = approvers.find((a) => a.id === approverId);
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
    <form onSubmit={onSubmit} className="anim-rise">
      <div className="mx-auto max-w-[56rem] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <PageHeader title="העלאת עבודה" subtitle="מעלים פעם אחת, והמאשר מקבל התראה. בלי מייל ובלי קובץ מצורף." />

        <ol className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-stone-200/80 bg-stone-200/80 sm:grid-cols-2 xl:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.title} className="flex items-center gap-3 bg-white px-3.5 py-3 sm:px-4">
              <IconTile icon={f.icon} tone={f.tone} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">
                  <span className="num me-1.5 text-stone-400">{i + 1}</span>
                  {f.title}
                </div>
                <div className="mt-0.5 truncate text-xs text-stone-500">{f.text}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 divide-y divide-stone-200/80 border-t border-stone-200/80">
          <Row icon={FileImage} tone="signal" title="קובץ לתצוגה" desc="מה שהמאשר יראה ויסמן עליו הערות. PNG, JPG או PDF.">
            <FileDrop
              file={preview}
              onChange={(f) => {
                setPreview(f);
                if (f && !title) setTitle(titleFromFile(f.name));
              }}
              accept={PREVIEW_ACCEPT}
              validate={validatePreview}
              title="גוררים לכאן קובץ"
              hint="עד 40MB"
              showPreview
              testId="preview-input"
            />
            {tried && !preview && <p className="mt-2 text-sm text-red-700">צריך לבחור קובץ לתצוגה</p>}
          </Row>

          <Row icon={Paperclip} tone="stone" title="קובץ מקור" desc="PSD, AI, INDD וכו׳. יישמר יחד עם העבודה, וכל הצוות יוכל להוריד אותו." optional>
            <FileDrop file={source} onChange={setSource} validate={validateSource} title="גוררים לכאן קובץ" hint="עד 150MB" compact testId="source-input" />
          </Row>

          <Row icon={PenLine} tone="sky" title="פרטים" desc="שם ברור עוזר למצוא את העבודה אחר כך בארכיון.">
            <div className="space-y-4">
              <Field label="שם העבודה" error={tried && !title.trim() ? 'חסר שם לעבודה' : undefined}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: באנר ראשי לאתר – ראש השנה" className="input" data-testid="title-input" />
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
                  <div className="flex gap-2">
                    <input type="date" value={dueDate} min={plusDays(0)} onChange={(e) => setDueDate(e.target.value)} className="input min-w-0" />
                  </div>
                  <div className="mt-2 flex gap-1">
                    {DUE_PRESETS.map((p) => {
                      const v = plusDays(p.days);
                      return (
                        <button
                          key={p.days}
                          type="button"
                          onClick={() => setDueDate(v)}
                          className={`h-7 rounded-md border px-2.5 text-sm transition ${dueDate === v ? 'border-ink bg-ink text-white' : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:text-ink'}`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </div>
          </Row>

          <Row icon={Send} tone="violet" title="למי לשלוח" desc="ההתראה תגיע למאשר בערוץ שבו הוא עובד.">
            <div className="overflow-hidden rounded-lg border border-stone-200/80 bg-white" role="radiogroup">
              {approvers.map((a, i) => {
                const selected = approverId === a.id;
                const q = pendingFor(a.id);
                return (
                  <label key={a.id} className={`flex cursor-pointer items-center gap-3 px-3.5 py-3 transition-colors ${i > 0 ? 'border-t border-stone-100' : ''} ${selected ? 'bg-stone-50' : 'hover:bg-stone-50/60'}`}>
                    <input type="radio" name="approver" value={a.id} checked={selected} onChange={() => setApproverId(a.id)} className="sr-only" />
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-ink bg-ink' : 'border-stone-300'}`}>
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <Avatar user={a} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base text-ink">{a.name}</span>
                      <span className="block text-sm text-stone-500">{a.title}</span>
                    </span>
                    <span className="hidden text-end sm:block">
                      <span className="num block text-sm text-stone-500">{q === 0 ? 'התור פנוי' : q === 1 ? 'עבודה אחת בתור' : `${q} עבודות בתור`}</span>
                      <span className="mt-1 block">
                        <ChannelTag channel={channelOf(a.id)} />
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4">
              <Field label="הערה למאשר" optional>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="הקשר, על מה לשים לב, מתי זה יוצא לדפוס" className="input resize-none" />
              </Field>
            </div>
          </Row>
        </div>
      </div>

      {/* סרגל שליחה */}
      <div className="sticky bottom-[57px] z-20 border-t border-stone-200/80 bg-white/95 backdrop-blur lg:bottom-0">
        <div className="mx-auto flex max-w-[56rem] items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <div className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-stone-500 sm:flex">
            {approver && (
              <>
                <Check className="h-4 w-4 shrink-0 text-stone-400" />
                <span className="truncate">
                  יישלח ל<span className="text-ink">{approver.name}</span>, עם דדליין {dueLabel(dueDate)}. התראה תגיע ב-{channelOf(approver.id)}.
                </span>
              </>
            )}
          </div>
          {tried && !valid && <span className="text-sm text-red-700">חסרים פרטים</span>}
          <Button type="submit" variant="primary" loading={busy} className="flex-1 sm:flex-none" data-testid="submit-upload">
            שליחה לאישור
          </Button>
        </div>
      </div>
    </form>
  );
}

function Row({ title, desc, optional, icon, tone, children }: { title: string; desc?: string; optional?: boolean; icon?: LucideIcon; tone?: Tone; children: ReactNode }) {
  return (
    <section className="grid gap-4 py-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
      <div>
        {icon && <IconTile icon={icon} tone={tone} size="md" className="mb-3" />}
        <h2 className="text-base font-medium">
          {title}
          {optional && <span className="ms-1.5 text-sm font-normal text-stone-400">לא חובה</span>}
        </h2>
        {desc && <p className="mt-1 text-sm text-stone-500">{desc}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {optional && <span className="ms-1.5 font-normal text-stone-400">לא חובה</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
