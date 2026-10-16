import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Status } from '../../types';

type Decision = Exclude<Status, 'pending'>;
export type ReviewTally = Record<Decision, number>;

interface UI {
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  guideOpen: boolean;
  setGuideOpen: (v: boolean) => void;
  /** כמה החלטות התקבלו בסשן הסקירה הנוכחי (לסיכום "סיימת את התור") */
  reviewTally: ReviewTally;
  recordDecision: (d: Decision, delta?: 1 | -1) => void;
  /** הדמיית מסירת ההתראה בערוץ של הנמען (אפשר לכבות) */
  deliveryPreviews: boolean;
  setDeliveryPreviews: (v: boolean) => void;
}

const PREVIEWS_KEY = 'gadot:delivery-previews';

const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [reviewTally, setTally] = useState<ReviewTally>({ approved: 0, changes: 0, rejected: 0 });
  const [deliveryPreviews, setPreviewsState] = useState(() => {
    try {
      return localStorage.getItem(PREVIEWS_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const setDeliveryPreviews = useCallback((v: boolean) => {
    setPreviewsState(v);
    try {
      localStorage.setItem(PREVIEWS_KEY, v ? 'on' : 'off');
    } catch {
      // לא קריטי
    }
  }, []);
  const recordDecision = useCallback((d: Decision, delta: 1 | -1 = 1) => setTally((t) => ({ ...t, [d]: Math.max(0, t[d] + delta) })), []);
  const value = useMemo(
    () => ({ paletteOpen, setPaletteOpen, guideOpen, setGuideOpen, reviewTally, recordDecision, deliveryPreviews, setDeliveryPreviews }),
    [paletteOpen, guideOpen, reviewTally, recordDecision, deliveryPreviews, setDeliveryPreviews],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI outside UIProvider');
  return c;
}
