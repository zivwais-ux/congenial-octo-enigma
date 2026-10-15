import { useState } from 'react';
import { CheckCircle2, Wrench, XCircle } from 'lucide-react';
import type { Status } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Kbd } from '../ui/Kbd';
import { comments, firstName } from '../../lib/copy';

export type Decision = Exclude<Status, 'pending'>;

interface Props {
  onDecide: (d: Decision, text: string) => void;
  openPinCount: number;
  designerName: string;
  itemTitle: string;
  versionNumber: number;
}

/** כפתורי ההחלטה של המאשר. בדסקטופ – בראש הפאנל; במובייל – סרגל קבוע בתחתית */
export function DecisionPanel(p: Props) {
  const [open, setOpen] = useState<Decision | null>(null);

  return (
    <>
      {/* דסקטופ */}
      <div className="hidden border-b border-zinc-200 p-4 lg:block" data-testid="decision-bar">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-bold text-zinc-900">ההחלטה שלך</span>
          <span className="text-xs text-zinc-400">על גרסה {p.versionNumber}</span>
        </div>
        <Button variant="approve" size="lg" block icon={<CheckCircle2 className="h-[18px] w-[18px]" />} onClick={() => setOpen('approved')}>
          מאושר
        </Button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="changes-soft" icon={<Wrench className="h-4 w-4" />} onClick={() => setOpen('changes')}>
            נדרשים תיקונים
          </Button>
          <Button variant="reject-soft" icon={<XCircle className="h-4 w-4" />} onClick={() => setOpen('rejected')}>
            נדחה
          </Button>
        </div>
      </div>

      {/* מובייל */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md lg:hidden"
        data-testid="decision-bar-mobile"
      >
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
          <Button variant="approve" size="lg" icon={<CheckCircle2 className="h-[18px] w-[18px]" />} onClick={() => setOpen('approved')}>
            מאושר
          </Button>
          <Button variant="changes" size="lg" className="px-2 text-[13px]" onClick={() => setOpen('changes')}>
            תיקונים
          </Button>
          <Button variant="reject" size="lg" className="px-2 text-[13px]" onClick={() => setOpen('rejected')}>
            נדחה
          </Button>
        </div>
      </div>

      <DecisionModal decision={open} onClose={() => setOpen(null)} {...p} />
    </>
  );
}

function DecisionModal({ decision, onClose, onDecide, openPinCount, designerName, itemTitle }: Props & { decision: Decision | null; onClose: () => void }) {
  const [text, setText] = useState('');
  const close = () => {
    setText('');
    onClose();
  };
  if (!decision) return null;

  const first = firstName(designerName);
  const cfg = {
    approved: {
      title: 'לאשר את העבודה?',
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
      desc: (
        <>
          "{itemTitle}" תעבור לארכיון עם כל הגרסאות וקובץ המקור, ותישלח התראה ל{designerName}.
        </>
      ),
      placeholder: `מילה טובה ל${first} (לא חובה)`,
      required: false,
      confirm: 'אישור העבודה',
      variant: 'approve' as const,
    },
    changes: {
      title: 'בקשת תיקונים',
      icon: <Wrench className="h-6 w-6 text-amber-600" />,
      desc:
        openPinCount > 0 ? (
          <>
            {comments(openPinCount)} שסימנת על העבודה יגיעו ל{first} יחד עם הבקשה.
          </>
        ) : (
          'טיפ: לפני השליחה אפשר ללחוץ על נקודות בעבודה, כדי שיהיה ברור בדיוק מה לתקן.'
        ),
      placeholder: 'סיכום קצר: מה צריך לתקן? (חובה)',
      required: true,
      confirm: `שליחה ל${first}`,
      variant: 'changes' as const,
    },
    rejected: {
      title: 'לדחות את העבודה?',
      icon: <XCircle className="h-6 w-6 text-rose-600" />,
      desc: 'דחייה סוגרת את העבודה. אם התיקונים יכולים להציל אותה, עדיף לבקש תיקונים.',
      placeholder: 'למה העבודה לא מתאימה? (חובה)',
      required: true,
      confirm: 'דחיית העבודה',
      variant: 'reject' as const,
    },
  }[decision];

  const valid = !cfg.required || text.trim().length > 0;
  const submit = () => {
    if (!valid) return;
    onDecide(decision, text.trim());
    close();
  };

  return (
    <Modal open onClose={close} title={cfg.title} description={cfg.desc} icon={cfg.icon}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={4}
          placeholder={cfg.placeholder}
          className="input resize-none"
          data-testid="decision-text"
        />
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="hidden items-center gap-1 text-[11px] text-zinc-400 sm:flex">
            <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> לשליחה
          </span>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={close}>
              ביטול
            </Button>
            <Button type="submit" variant={cfg.variant} disabled={!valid} data-testid="decision-confirm">
              {cfg.confirm}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
