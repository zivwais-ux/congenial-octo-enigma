import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppState, User } from '../types';
import { AppStateSchema, describeIssues } from '../schema';
import { createSeed, SCHEMA_VERSION } from '../data/seed';
import { clearFiles } from './fileStore';

const STORAGE_KEY = 'gadot-approvals:state';

/**
 * למה התחלנו מנתוני הדמה ולא מהנתונים השמורים:
 * - none: נטענו הנתונים השמורים כרגיל (או שאין נתונים – ביקור ראשון)
 * - outdated: נשמרו בגרסה קודמת של ההדגמה
 * - invalid: הנתונים השמורים פגומים או לא עוברים את בדיקת הסכמה
 */
export type LoadOutcome = 'none' | 'outdated' | 'invalid';

function load(): { state: AppState; outcome: LoadOutcome } {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage חסום (למשל גלישה בסתר בחלק מהדפדפנים) – מתחילים מנתוני הדמה
  }
  if (!raw) return { state: createSeed(), outcome: 'none' };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    console.warn('[גדות] הנתונים השמורים אינם JSON תקין. ההדגמה אופסה.');
    return { state: createSeed(), outcome: 'invalid' };
  }

  if ((data as { schema?: unknown } | null)?.schema !== SCHEMA_VERSION) return { state: createSeed(), outcome: 'outdated' };

  // הבדיקה עצמה: צורה של כל רשומה + הפניות תקינות בין הרשומות
  const result = AppStateSchema.safeParse(data);
  if (!result.success) {
    console.warn(`[גדות] הנתונים השמורים לא עברו את בדיקת הסכמה, ולכן ההדגמה אופסה:\n${describeIssues(result.error)}`);
    return { state: createSeed(), outcome: 'invalid' };
  }
  return { state: result.data, outcome: 'none' };
}

interface StoreValue {
  state: AppState;
  /** מפעיל פעולה טהורה (state → state) ושומר */
  update: (fn: (s: AppState) => AppState) => void;
  resetDemo: () => void;
  currentUser: User;
  /** האם הנתונים השמורים נפסלו בטעינה (כדי להציג הודעה) */
  loadOutcome: LoadOutcome;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(load);
  const [state, setState] = useState<AppState>(initial.state);

  useEffect(() => {
    // בזמן פיתוח: כל שינוי ב-state נבדק מול הסכמה, כדי לתפוס באג מיד כשהוא נוצר
    if (import.meta.env.DEV) {
      const check = AppStateSchema.safeParse(state);
      if (!check.success) console.error(`[גדות] פעולה יצרה נתונים לא תקינים:\n${describeIssues(check.error)}`);
    }
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

  const value = useMemo(
    () => ({ state, update, resetDemo, currentUser, loadOutcome: initial.outcome }),
    [state, update, resetDemo, currentUser, initial.outcome],
  );
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
