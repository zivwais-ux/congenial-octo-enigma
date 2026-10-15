import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import type { Channel } from '../../types';
import { ChannelTag } from './ChannelTag';

interface Toast {
  id: number;
  text: string;
  tone: 'success' | 'info';
  channel?: Channel;
}

type Push = (text: string, opts?: { tone?: Toast['tone']; channel?: Channel }) => void;

const ToastContext = createContext<Push>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<Push>((text, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone: opts.tone ?? 'success', channel: opts.channel }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="anim-rise pointer-events-auto flex max-w-md items-center gap-3 rounded-xl bg-zinc-900 py-2.5 pe-3 ps-3.5 text-sm text-white shadow-pop ring-1 ring-white/10"
          >
            {t.tone === 'success' ? <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-400" /> : <Info className="h-[18px] w-[18px] shrink-0 text-brand-300" />}
            <span className="font-medium">{t.text}</span>
            {t.channel && (
              <span className="flex shrink-0 items-center gap-1.5 border-s border-white/15 ps-3 text-xs text-zinc-400">
                התראה ב-
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
