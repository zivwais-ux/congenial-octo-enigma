import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppState, User } from '../types';
import { createSeed, SCHEMA_VERSION } from '../data/seed';
import { clearFiles } from './fileStore';

const STORAGE_KEY = 'gadot-approvals:state';

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.schema === SCHEMA_VERSION) return parsed;
    }
  } catch {
    // localStorage חסום או פגום – מתחילים מנתוני הדמה
  }
  return createSeed();
}

interface StoreValue {
  state: AppState;
  /** מפעיל פעולה טהורה (state → state) ושומר */
  update: (fn: (s: AppState) => AppState) => void;
  resetDemo: () => void;
  currentUser: User;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // אין מקום / חסום – הדמו ממשיך לעבוד בזיכרון
    }
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const resetDemo = useCallback(() => {
    void clearFiles();
    setState((s) => ({ ...createSeed(), currentUserId: s.currentUserId }));
  }, []);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];

  const value = useMemo(() => ({ state, update, resetDemo, currentUser }), [state, update, resetDemo, currentUser]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function useLookups() {
  const { state } = useStore();
  return useMemo(() => {
    const userById = new Map(state.users.map((u) => [u.id, u]));
    const projectById = new Map(state.projects.map((p) => [p.id, p]));
    return { userById, projectById };
  }, [state.users, state.projects]);
}
