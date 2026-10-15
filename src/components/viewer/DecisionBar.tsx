import { useState } from 'react';
import { CheckCircle2, Wrench, XCircle } from 'lucide-react';
import type { Status } from '../../types';
import { Modal } from '../ui/Modal';

type Decision = Exclude<Status, 'pending'>;

const META: Record<Decision, { label: string; title: string; btn: string; confirm: string; required: boolean; placeholder: string }> = {
  approved: {
    label: 'מאושר',
    title: 'אישור העבודה',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    confirm: 'אישור',
    required: false,
    placeholder: 'מילה טובה למעצב (לא חובה)',
  },
  changes: {
    label: 'נדרשים תיקונים',
    title: 'בקשת תיקונים',
    btn: 'bg-amber-500 hover:bg-amber-600 text-white',
    confirm: 'שליחת בקשת תיקונים',
    required: true,
    placeholder: 'מה צריך לתקן? (חובה)',
  },
  rejected: {
    label: 'נדחה',
    title: 'דחיית העבודה',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    confirm: 'דחייה',
    required: true,
    placeholder: 'למה העבודה נדחית? (חובה)',
  },
};

const ICONS = { approved: CheckCircle2, changes: Wrench, rejected: XCircle };

export function DecisionBar({
  onDecide,
  openPinCount,
  designerName,
}: {
  onDecide: (d: Decision, text: string) => void;
  openPinCount: number;
  designerName: string;
}) {
  const [open, setOpen] = useState<Decision | null>(null);
  const [text, setText] = useState('');
  const m = open ? META[open] : null;

  const close = () => {
    setOpen(null);
    setText('');
  };

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:static lg:z-auto lg:border-0 lg:border-b lg:bg-transparent lg:p-4 lg:shadow-none"
        data-testid="decision-bar"
      >
        <div className="mb-2 hidden text-xs font-medium text-slate-500 lg:block">ההחלטה שלך</div>
        <div className="grid grid-cols-3 gap-2">
          {(['approved', 'changes', 'rejected'] as Decision[]).map((d) => {
            const Icon = ICONS[d];
            return (
              <button
                key={d}
                onClick={() => setOpen(d)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-semibold shadow-sm transition sm:flex-row sm:text-sm ${META[d].btn}`}
              >
                <Icon className="h-4 w-4" />
                {META[d].label}
              </button>
            );
          })}
        </div>
      </div>

      <Modal open={!!open} onClose={close} title={m?.title ?? ''}>
        {open && m && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (m.required && !text.trim()) return;
              onDecide(open, text.trim());
              close();
            }}
          >
            {open === 'changes' && openPinCount > 0 && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {openPinCount} הערות פתוחות על התמונה יגיעו ל{designerName} יחד עם הבקשה.
              </p>
            )}
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder={m.placeholder}
              className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              data-testid="decision-text"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={close} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                ביטול
              </button>
              <button
                type="submit"
                disabled={m.required && !text.trim()}
                className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-40 ${m.btn}`}
                data-testid="decision-confirm"
              >
                {m.confirm}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
