import { useState } from 'react';
import type { Item } from '../../types';
import { useStore } from '../../store/StoreProvider';
import { addVersion } from '../../store/actions';
import { saveFile } from '../../store/fileStore';
import { channelOf } from '../../lib/status';
import { comments } from '../../lib/copy';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { FileDrop, mimeOf, PREVIEW_ACCEPT, validatePreview, validateSource } from '../ui/FileDrop';

export function NewVersionModal({ item, open, onClose }: { item: Item; open: boolean; onClose: () => void }) {
  const { state, update } = useStore();
  const toast = useToast();
  const [preview, setPreview] = useState<File | null>(null);
  const [source, setSource] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const next = item.versions.length + 1;
  const approver = state.users.find((u) => u.id === item.approverId);
  const latest = item.versions[item.versions.length - 1];
  // הערות ראשיות על הגרסה הנוכחית, במספור של הסימונים על העבודה
  const topLevel = state.comments
    .filter((c) => c.itemId === item.id && c.versionId === latest.id && !c.parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const pinNumber = new Map(topLevel.filter((c) => c.pin).map((c, i) => [c.id, i + 1]));
  const openList = topLevel.filter((c) => !c.resolved);
  const [fixed, setFixed] = useState<Set<string>>(new Set());
  const [noteTouched, setNoteTouched] = useState(false);

  const toggleFix = (id: string) => {
    const nextSet = new Set(fixed);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    setFixed(nextSet);
    // "מה השתנה" מתמלא מההערות שסומנו, עד שעורכים אותו ידנית
    if (!noteTouched) {
      const parts = openList.filter((c) => nextSet.has(c.id)).map((c) => shorten(c.text));
      setNote(parts.length ? `תוקן: ${parts.join('; ')}` : '');
    }
  };

  const close = () => {
    setPreview(null);
    setSource(null);
    setNote('');
    setFixed(new Set());
    setNoteTouched(false);
    onClose();
  };

  const submit = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const previewUrl = await saveFile(preview);
      const sourceUrl = source ? await saveFile(source) : undefined;
      update((s) =>
        addVersion(s, item.id, {
          note: note.trim(),
          preview: { url: previewUrl, name: preview.name, mime: mimeOf(preview) },
          source: source && sourceUrl ? { url: sourceUrl, name: source.name } : undefined,
          fixes: [...fixed],
        }),
      );
      toast(fixed.size ? `גרסה ${next} נשלחה ל${approver?.name} · ${comments(fixed.size)} ${fixed.size === 1 ? 'סומנה' : 'סומנו'} כטופלו` : `גרסה ${next} נשלחה ל${approver?.name}`, {
        channel: channelOf(item.approverId),
      });
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`העלאת גרסה ${next}`}
      description={approver ? `הגרסה תחזור ל${approver.name} לאישור. גרסה ${latest.number} נשארת בהיסטוריה להשוואה.` : undefined}
      width="max-w-[480px]"
    >
      <div className="space-y-3">
        {openList.length > 0 && (
          <div className="rounded-lg border border-stone-200" data-testid="fix-checklist">
            <div className="flex items-baseline justify-between border-b border-stone-100 px-3 py-2">
              <span className="text-sm font-medium text-ink">מה תוקן בגרסה הזו?</span>
              <span className="num text-xs text-stone-500">
                {fixed.size} מתוך {openList.length}
              </span>
            </div>
            <ul className="max-h-44 divide-y divide-stone-100 overflow-y-auto">
              {openList.map((c) => {
                const author = state.users.find((u) => u.id === c.authorId);
                const n = pinNumber.get(c.id);
                return (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2 transition hover:bg-stone-50">
                      <input type="checkbox" checked={fixed.has(c.id)} onChange={() => toggleFix(c.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#1c1917]" data-testid="fix-item" />
                      <span
                        className={`num mt-px flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1 text-2xs font-medium ${n ? 'bg-signal-600 text-white' : 'bg-stone-100 text-stone-500'}`}
                      >
                        {n ?? '·'}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">
                        <span className={`block text-sm ${fixed.has(c.id) ? 'text-stone-400 line-through' : 'text-ink'}`}>{c.text}</span>
                        <span className="block text-xs text-stone-500">{author?.name}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-stone-100 px-3 py-2 text-xs text-stone-500">הערות שיסומנו ייסגרו כ"טופל", והמאשר יראה אותן על הגרסה החדשה.</p>
          </div>
        )}
        <FileDrop
          file={preview}
          onChange={setPreview}
          accept={PREVIEW_ACCEPT}
          validate={validatePreview}
          title="קובץ לתצוגה"
          hint="PNG, JPG או PDF"
          showPreview
          compact
          testId="version-preview-input"
        />
        <FileDrop file={source} onChange={setSource} validate={validateSource} title="קובץ מקור" hint="לא חובה · PSD, AI, INDD" compact />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">מה השתנה</label>
          <textarea value={note} onChange={(e) => {
              setNote(e.target.value);
              setNoteTouched(true);
            }} rows={3} placeholder="יוצג ליד הגרסה, למאשר ולצוות" className="input resize-none" data-testid="version-note" />
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={close}>
          ביטול
        </Button>
        <Button variant="primary" onClick={submit} disabled={!preview} loading={busy} data-testid="submit-version">
          שליחת גרסה {next}
        </Button>
      </div>
    </Modal>
  );
}

function shorten(text: string, max = 42) {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
