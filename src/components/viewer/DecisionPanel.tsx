import { useState } from 'react';
import { Check } from 'lucide-react';
import type { BrandCheck, Status } from '../../types';
import { BRAND_CHECKS } from '../../lib/checks';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { comments, firstName } from '../../lib/copy';

export type Decision = Exclude<Status, 'pending'>;

interface Props {
  onDecide: (d: Decision, text: string, checks?: BrandCheck[]) => void;
  openPinCount: number;
  designerName: string;
  itemTitle: string;
  versionNumber: number;
}

/** החלטת המאשר. בדסקטופ – בראש הפאנל; במובייל – סרגל קבוע בתחתית */
export function DecisionPanel(p: Props) {
  const [open, setOpen] = useState<Decision | null>(null);

  return (
    <>
      <div className="hidden border-b border-stone-200/80 px-4 py-4 lg:block" data-testid="decision-bar">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-medium text-ink">ההחלטה שלך</span>
          <span className="text-xs text-stone-400">גרסה {p.versionNumber}</span>
        </div>
        <Button variant="approve" block icon={<Check className="h-4 w-4" strokeWidth={2.25} />} onClick={() => setOpen('approved')}>
          מאושר
        </Button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setOpen('changes')}>
            נדרשים תיקונים
          </Button>
          <Button variant="danger" onClick={() => setOpen('rejected')}>
            נדחה
          </Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden" data-testid="decision-bar-mobile">
        <div className="grid grid-cols-[1.3fr_1fr_0.8fr] gap-2">
          <Button variant="approve" size="lg" icon={<Check className="h-4 w-4" strokeWidth={2.25} />} onClick={() => setOpen('approved')}>
            מאושר
          </Button>
          <Button variant="secondary" size="lg" className="px-2" onClick={() => setOpen('changes')}>
            תיקונים
          </Button>
          <Button variant="danger" size="lg" className="px-2" onClick={() => setOpen('rejected')}>
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
  const [checks, setChecks] = useState<BrandCheck[]>([]);
  const close = () => {
    setText('');
    setChecks([]);
    onClose();
  };
  if (!decision) return null;

  const first = firstName(designerName);
  const cfg = {
    approved: {
      title: 'אישור העבודה',
      desc: `"${itemTitle}" תעבור לארכיון עם כל הגרסאות, ותישלח התראה ל${designerName}.`,
      placeholder: `מילה ל${first} (לא חובה)`,
      required: false,
      confirm: 'אישור',
      variant: 'approve' as const,
    },
    changes: {
      title: 'בקשת תיקונים',
      desc: openPinCount > 0 ? `${comments(openPinCount)} שסימנת על העבודה יישלחו ל${first} יחד עם הבקשה.` : 'כדאי לסמן נקודות על העבודה לפני השליחה, כדי שיהיה ברור מה לתקן.',
      placeholder: 'סיכום קצר של מה שצריך לתקן',
      required: true,
      confirm: `שליחה ל${first}`,
      variant: 'primary' as const,
    },
    rejected: {
      title: 'דחיית העבודה',
      desc: 'דחייה סוגרת את העבודה. אם תיקונים יכולים להציל אותה, עדיף לבקש תיקונים.',
      placeholder: 'למה העבודה לא מתאימה',
      required: true,
      confirm: 'דחייה',
      variant: 'danger-solid' as const,
    },
  }[decision];

  const valid = !cfg.required || text.trim().length > 0;
  const submit = () => {
    if (!valid) return;
    onDecide(decision, text.trim(), decision === 'approved' ? BRAND_CHECKS.filter((c) => checks.includes(c.id)).map((c) => c.id) : undefined);
    close();
  };

  return (
    <Modal open onClose={close} title={cfg.title} description={cfg.desc}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {decision === 'approved' && (
          <fieldset className="mb-4 rounded-lg border border-stone-200" data-testid="brand-checklist">
            <legend className="sr-only">צ'קליסט מותג</legend>
            <div className="flex items-baseline justify-between border-b border-stone-100 px-3 py-2">
              <span className="text-sm font-medium text-ink">לפני שמאשרים</span>
              <span className={`num text-xs ${checks.length === BRAND_CHECKS.length ? 'text-emerald-700' : 'text-stone-500'}`}>
                {checks.length} מתוך {BRAND_CHECKS.length} נבדקו
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {BRAND_CHECKS.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-ink transition hover:bg-stone-50">
                  <input
                    type="checkbox"
                    checked={checks.includes(c.id)}
                    onChange={() => setChecks((cur) => (cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]))}
                    className="h-4 w-4 shrink-0 accent-[#047857]"
                    data-testid="brand-check"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {checks.length < BRAND_CHECKS.length && <p className="border-t border-stone-100 px-3 py-1.5 text-xs text-stone-500">לא חובה. מה שיסומן יתועד בציר הפעילות ובארכיון.</p>}
          </fieldset>
        )}
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {cfg.required ? 'הסבר' : 'הערה'}
          {!cfg.required && <span className="ms-1.5 font-normal text-stone-400">לא חובה</span>}
        </label>
        <textarea
          autoFocus={decision !== 'approved'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={decision === 'approved' ? 2 : 4}
          placeholder={cfg.placeholder}
          className="input resize-none"
          data-testid="decision-text"
        />
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={close}>
            ביטול
          </Button>
          <Button type="submit" variant={cfg.variant} disabled={!valid} data-testid="decision-confirm">
            {cfg.confirm}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
