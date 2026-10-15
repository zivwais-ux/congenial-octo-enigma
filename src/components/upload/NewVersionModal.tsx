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
  const openComments = state.comments.filter((c) => c.itemId === item.id && c.versionId === latest.id && !c.resolved).length;

  const close = () => {
    setPreview(null);
    setSource(null);
    setNote('');
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
        }),
      );
      toast(`גרסה ${next} נשלחה ל${approver?.name}`, { channel: channelOf(item.approverId) });
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
        {openComments > 0 && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {comments(openComments)} על גרסה {latest.number} עדיין לא {openComments === 1 ? 'סומנה' : 'סומנו'} כטופלו. אפשר להעלות בכל זאת.
          </p>
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
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="יוצג ליד הגרסה, למאשר ולצוות" className="input resize-none" data-testid="version-note" />
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
