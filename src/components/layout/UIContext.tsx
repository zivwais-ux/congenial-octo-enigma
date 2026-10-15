import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface UI {
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  guideOpen: boolean;
  setGuideOpen: (v: boolean) => void;
}

const Ctx = createContext<UI | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const value = useMemo(() => ({ paletteOpen, setPaletteOpen, guideOpen, setGuideOpen }), [paletteOpen, guideOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUI outside UIProvider');
  return c;
}
