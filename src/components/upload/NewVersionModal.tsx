import { useState } from 'react';
import { Layers } from 'lucide-react';
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
      description={approver ? `הגרסה תחזור ל${approver.name} לאישור, וגרסה ${latest.number} תישאר בהיסטוריה להשוואה.` : undefined}
      icon={
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Layers className="h-5 w-5" />
        </span>
      }
      width="max-w-lg"
    >
      <div className="space-y-3">
        {openComments > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
            {comments(openComments)} על גרסה {latest.number} עדיין לא {openComments === 1 ? 'סומנה' : 'סומנו'} כ"טופל". אפשר להעלות בכל זאת.
          </p>
        )}
        <FileDrop
          file={preview}
          onChange={setPreview}
          accept={PREVIEW_ACCEPT}
          validate={validatePreview}
          title="קובץ התצוגה של הגרסה החדשה"
          hint="PNG, JPG או PDF · גוררים לכאן או לוחצים לבחירה"
          showPreview
          compact
          testId="version-preview-input"
        />
        <FileDrop file={source} onChange={setSource} validate={validateSource} title="קובץ מקור (לא חובה)" hint="PSD, AI, INDD וכו׳" compact />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="מה השתנה בגרסה הזו? ההערה תוצג ליד הגרסה"
          className="input resize-none"
          data-testid="version-note"
        />
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={close}>
          ביטול
        </Button>
        <Button variant="primary" onClick={submit} disabled={!preview} loading={busy} data-testid="submit-version">
          שליחת גרסה {next} לאישור
        </Button>
      </div>
    </Modal>
  );
}
