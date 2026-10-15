// "סיור הדגמה": חמשת הצעדים של תסריט ההצגה להנהלה, נגזרים מה-state
import type { AppState, Item } from '../types';
import { SEED_ITEM_IDS } from '../data/seed';

export function demoItem(s: AppState): Item | undefined {
  return s.items.find((i) => !SEED_ITEM_IDS.has(i.id));
}

export interface TourStep {
  key: string;
  title: string;
  text: string;
  done: boolean;
  /** למי לעבור ולאן לנווט כדי לבצע את הצעד */
  userId?: string;
  path?: string;
}

export function tourSteps(s: AppState): TourStep[] {
  const item = demoItem(s);
  const designerId = item?.designerId ?? 'u3';
  const approverId = item?.approverId ?? 'u1';
  const decided = (status: string) => !!item?.events.some((e) => e.type === 'decision' && e.status === status);
  const itemPath = item ? `/item/${item.id}` : undefined;
  return [
    {
      key: 'upload',
      title: 'העלאת עבודה',
      text: 'בתפקיד המעצב: גוררים קובץ אמיתי מהמחשב, בוחרים מאשר ושולחים. ההתראה יוצאת מיד.',
      done: !!item,
      userId: designerId,
      path: '/upload',
    },
    {
      key: 'changes',
      title: 'הערות על התמונה ובקשת תיקונים',
      text: 'בתפקיד המאשר: פותחים מהפעמון, לוחצים על שתי נקודות בתמונה וכותבים מה לתקן.',
      done: decided('changes'),
      userId: approverId,
      path: itemPath,
    },
    {
      key: 'version',
      title: 'העלאת גרסה 2',
      text: 'בתפקיד המעצב: ההערות מחכות על התמונה. מסמנים "טופל" ומעלים גרסה מתוקנת.',
      done: (item?.versions.length ?? 0) >= 2,
      userId: designerId,
      path: itemPath,
    },
    {
      key: 'approve',
      title: 'השוואה ואישור',
      text: 'בתפקיד המאשר: גרסה 1 מול גרסה 2, זו לצד זו או בתריס, ואז "מאושר".',
      done: item?.status === 'approved',
      userId: approverId,
      path: itemPath,
    },
    {
      key: 'archive',
      title: 'מציאת העבודה בארכיון',
      text: 'מוצאים אותה בחיפוש, ומרעננים את הדף כדי להראות שהכל נשמר.',
      done: item?.status === 'approved' && s.tour.archiveSeen,
      path: '/archive',
    },
  ];
}
