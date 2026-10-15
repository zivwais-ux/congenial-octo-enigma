import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** מודאל; במובייל נפתח כגיליון תחתון */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 'max-w-[440px]',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-[70] flex items-end justify-center bg-stone-950/30 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`anim-sheet w-full ${width} max-h-[92vh] overflow-y-auto rounded-t-xl bg-white pb-[env(safe-area-inset-bottom)] shadow-pop sm:rounded-xl`}
      >
        <div className="flex items-start gap-4 px-5 pb-3 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold leading-6">{title}</h2>
            {description && <div className="mt-1 text-sm text-stone-500">{description}</div>}
          </div>
          <button onClick={onClose} className="-me-1.5 -mt-1 rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-ink" aria-label="סגירה">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
