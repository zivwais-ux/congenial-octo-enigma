import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import type { Item } from '../../types';
import { useStore } from '../../store/StoreProvider';
import { addVersion } from '../../store/actions';
import { saveFile } from '../../store/fileStore';
import { Modal } from '../ui/Modal';
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
  const openComments = state.comments.filter((c) => c.itemId === item.id && c.versionId === item.versions[item.versions.length - 1].id && !c.resolved).length;

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
      toast(`גרסה ${next} נשלחה ל${approver?.name} לאישור`);
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title={`העלאת גרסה ${next}`}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        {openComments > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            שימו לב: {openComments} הערות על הגרסה הנוכחית עדיין לא סומנו כ"טופל".
          </p>
        )}
        <FileDrop
          file={preview}
          onChange={setPreview}
          accept={PREVIEW_ACCEPT}
          validate={validatePreview}
          title="קובץ תצוגה לגרסה החדשה"
          hint="PNG, JPG או PDF"
          showPreview
          compact
          testId="version-preview-input"
        />
        <FileDrop file={source} onChange={setSource} validate={validateSource} title="קובץ מקור (אופציונלי)" hint="PSD, AI, INDD…" compact />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="מה השתנה בגרסה הזו?"
          className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          data-testid="version-note"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={close} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          ביטול
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!preview || busy}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-40"
          data-testid="submit-version"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          שליחת גרסה {next}
        </button>
      </div>
    </Modal>
  );
}
