import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  /** כמו update, ומחזיר פונקציה שמבטלת את הפעולה (חוזרת למצב שלפניה) */
  updateUndoable: (fn: (s: AppState) => AppState) => () => void;
  resetDemo: () => void;
  currentUser: User;
  /** האם הנתונים השמורים נפסלו בטעינה (כדי להציג הודעה) */
  loadOutcome: LoadOutcome;
}

const StoreContext = createContext<StoreValue | null>(null);

/** מחזיר אוסף למצבו לפני פעולה: מסיר מה שנוסף, משחזר מה שנמחק או שונה. שאר השינויים נשמרים */
function revert<T extends { id: string }>(before: T[], after: T[], current: T[]): T[] {
  const beforeById = new Map(before.map((x) => [x.id, x]));
  const afterById = new Map(after.map((x) => [x.id, x]));
  const added = new Set(after.filter((x) => !beforeById.has(x.id)).map((x) => x.id));
  const changed = new Set(after.filter((x) => beforeById.has(x.id) && beforeById.get(x.id) !== x).map((x) => x.id));
  const removed = before.filter((x) => !afterById.has(x.id));
  const kept = current.filter((x) => !added.has(x.id)).map((x) => (changed.has(x.id) ? beforeById.get(x.id)! : x));
  const keptIds = new Set(kept.map((x) => x.id));
  return [...kept, ...removed.filter((x) => !keptIds.has(x.id))];
}

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

  // מצביע למצב העדכני, כדי לחשב את "לפני" ו"אחרי" של פעולה הפיכה בדיוק פעם אחת
  const stateRef = useRef(state);
  stateRef.current = state;

  const updateUndoable = useCallback((fn: (s: AppState) => AppState) => {
    const before = stateRef.current;
    const after = fn(before);
    stateRef.current = after;
    setState(after);
    // ביטול ממוקד: מחזיר רק את הרשומות שהפעולה הזו שינתה, כך שפעולות שבוצעו אחריה לא נפגעות
    return () =>
      setState((cur) => ({
        ...cur,
        items: revert(before.items, after.items, cur.items),
        comments: revert(before.comments, after.comments, cur.comments),
        notifications: revert(before.notifications, after.notifications, cur.notifications),
      }));
  }, []);

  const resetDemo = useCallback(() => {
    void clearFiles();
    setState((s) => ({ ...createSeed(), currentUserId: s.currentUserId }));
  }, []);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];

  const value = useMemo(
    () => ({ state, update, updateUndoable, resetDemo, currentUser, loadOutcome: initial.outcome }),
    [state, update, updateUndoable, resetDemo, currentUser, initial.outcome],
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
