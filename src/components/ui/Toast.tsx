import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { Channel } from '../../types';
import { ChannelTag } from './ChannelTag';

interface Toast {
  id: number;
  text: string;
  tone: 'success' | 'info';
  channel?: Channel;
  action?: ToastAction;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

type Push = (text: string, opts?: { tone?: Toast['tone']; channel?: Channel; action?: ToastAction }) => void;

const ToastContext = createContext<Push>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback<Push>((text, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone: opts.tone ?? 'success', channel: opts.channel, action: opts.action }]);
    // הודעה עם פעולה (למשל "ביטול") נשארת יותר זמן
    setTimeout(() => dismiss(id), opts.action ? 6500 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="anim-rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-lg bg-ink px-3.5 py-2.5 text-sm text-stone-100 shadow-pop">
            {t.tone === 'success' && <Check className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2.5} />}
            <span>{t.text}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="-my-1 ms-1 shrink-0 rounded-md px-2 py-1 text-sm font-medium text-signal-400 transition hover:bg-white/10 hover:text-signal-200"
                data-testid="toast-action"
              >
                {t.action.label}
              </button>
            )}
            {t.channel && (
              <span className="flex shrink-0 items-center gap-1.5 border-s border-white/15 ps-2.5 text-xs text-stone-400">
                התראה ב
                <ChannelTag channel={t.channel} dark />
              </span>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
