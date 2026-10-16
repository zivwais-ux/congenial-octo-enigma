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
}

const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [reviewTally, setTally] = useState<ReviewTally>({ approved: 0, changes: 0, rejected: 0 });
  const recordDecision = useCallback((d: Decision, delta: 1 | -1 = 1) => setTally((t) => ({ ...t, [d]: Math.max(0, t[d] + delta) })), []);
  const value = useMemo(
    () => ({ paletteOpen, setPaletteOpen, guideOpen, setGuideOpen, reviewTally, recordDecision }),
    [paletteOpen, guideOpen, reviewTally, recordDecision],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI outside UIProvider');
  return c;
}
