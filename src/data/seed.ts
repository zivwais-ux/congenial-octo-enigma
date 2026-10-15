import type { AppState, Comment, Item, ItemEvent, Notification, Pin, Project, Status, User, Version } from '../types';
import { placeholderDataUrl, type PlaceholderSpec } from './placeholders';
import { USER_CHANNEL } from '../lib/status';

export const SCHEMA_VERSION = 3;

/** מזהי עבודות הדמה – כל עבודה אחרת נוצרה במהלך ההדגמה */
export const SEED_ITEM_IDS = new Set(['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'i11', 'i12']);

const HOUR = 3600_000;
const DAY = 24 * HOUR;

export const users: User[] = [
  { id: 'u1', name: 'מיכל אברהם', role: 'approver', avatar: 'מא', title: 'מנהלת מחלקת עיצוב', color: '#8a5a44' },
  { id: 'u2', name: 'יוסי כהן', role: 'approver', avatar: 'יכ', title: 'גרפיקאי בכיר', color: '#3f6b6a' },
  { id: 'u3', name: 'נועה לוי', role: 'designer', avatar: 'נל', title: 'מעצבת גרפית', color: '#9d4b5c' },
  { id: 'u4', name: 'עומר מזרחי', role: 'designer', avatar: 'עמ', title: 'מעצב גרפי', color: '#7a6a3a' },
  { id: 'u5', name: 'שירה פרץ', role: 'designer', avatar: 'שפ', title: 'מעצבת דיגיטל', color: '#4f6b45' },
  { id: 'u6', name: 'דניאל ביטון', role: 'designer', avatar: 'דב', title: 'מעצב דפוס', color: '#4a5a7a' },
];

export const projects: Project[] = [
  { id: 'p1', name: 'קמפיין ראש השנה', color: '#c2410c' },
  { id: 'p2', name: 'קטלוג מוצרים 2027', color: '#3b6ea5' },
  { id: 'p3', name: 'שילוט תערוכה', color: '#b08a2e' },
  { id: 'p4', name: 'השקת קו "גדות פרו"', color: '#4d7c5a' },
];

interface SeedComment {
  v: number;
  author: string;
  text: string;
  pin?: Pin;
  resolved?: boolean;
  /** שעות אחרי העלאת הגרסה */
  h: number;
}

interface SeedItem {
  id: string;
  title: string;
  projectId: string;
  designerId: string;
  approverId: string;
  /** ימים מהיום (שלילי = עבר) */
  dueIn: number;
  createdDaysAgo: number;
  status: Status;
  spec: Omit<PlaceholderSpec, 'version'>;
  sourceExt?: string;
  versionNotes: string[];
  /** הערת ההחלטה אחרי כל גרסה (לפני הגרסה הבאה), והחלטה סופית אם הסטטוס אינו "ממתין" */
  decisionNotes: string[];
  comments: SeedComment[];
}

const RED: [string, string, string] = ['#fff7ed', '#c2410c', '#431407'];
const NIGHT: [string, string, string] = ['#1e1b4b', '#e11d48', '#ffffff'];
const BLUE: [string, string, string] = ['#e0f2fe', '#0369a1', '#0c4a6e'];
const TEAL: [string, string, string] = ['#ecfdf5', '#047857', '#064e3b'];
const SAND: [string, string, string] = ['#fef3c7', '#b45309', '#451a03'];
const SLATE: [string, string, string] = ['#f1f5f9', '#4f46e5', '#0f172a'];

const seedItems: SeedItem[] = [
  {
    id: 'i1',
    title: 'באנר ראשי לאתר – ראש השנה',
    projectId: 'p1',
    designerId: 'u3',
    approverId: 'u1',
    dueIn: 1,
    createdDaysAgo: 6,
    status: 'pending',
    spec: { kind: 'banner', title: 'שנה טובה ומתוקה', subtitle: '15% הנחה על כל סדרת הבית', cta: 'לרכישה', palette: RED },
    sourceExt: 'psd',
    versionNotes: ['גרסה ראשונה לבאנר הראשי, 1200x628. אשמח להערות על ההיררכיה.', 'הגדלתי את הכותרת והוספתי רימון שני. כפתור ה-CTA בצבע כהה כמו שביקשת.'],
    decisionNotes: ['כיוון טוב. הכותרת קטנה מדי וה-CTA לא בולט מספיק, ראי הערות על התמונה.'],
    comments: [
      { v: 1, author: 'u1', text: 'הכותרת צריכה להיות גדולה יותר, היא הולכת לאיבוד', pin: { x: 70, y: 44 }, resolved: true, h: 20 },
      { v: 1, author: 'u1', text: 'כפתור כתום על רקע בהיר לא מספיק בולט. לנסות כהה?', pin: { x: 66, y: 72 }, resolved: true, h: 20 },
      { v: 1, author: 'u3', text: 'מקבלת, מעלה גרסה מתוקנת מחר בבוקר', h: 26 },
    ],
  },
  {
    id: 'i2',
    title: 'פוסט אינסטגרם – ברכת שנה טובה',
    projectId: 'p1',
    designerId: 'u4',
    approverId: 'u1',
    dueIn: 2,
    createdDaysAgo: 3,
    status: 'changes',
    spec: { kind: 'social', title: 'שנה טובה', subtitle: 'מכל צוות גדות', palette: NIGHT },
    sourceExt: 'ai',
    versionNotes: ['פוסט ריבועי 1080x1080 לפיד, גם לפייסבוק.'],
    decisionNotes: ['נראה מצוין, רק שני תיקונים קטנים לפני שמעלים.'],
    comments: [
      { v: 1, author: 'u1', text: 'המסגרת דקה מדי, כמעט לא רואים אותה בטלפון', pin: { x: 12, y: 30 }, h: 18 },
      { v: 1, author: 'u1', text: 'להוסיף טיפת דבש שנייה בצד שמאל לאיזון', pin: { x: 28, y: 46 }, h: 18 },
      { v: 1, author: 'u1', text: 'הטקסט התחתון מצוין, לא לגעת', h: 19 },
    ],
  },
  {
    id: 'i3',
    title: 'כרטיס ברכה ללקוחות עסקיים',
    projectId: 'p1',
    designerId: 'u5',
    approverId: 'u2',
    dueIn: -3,
    createdDaysAgo: 14,
    status: 'approved',
    spec: { kind: 'card', title: 'שנה טובה', subtitle: 'תודה על שנה של שיתוף פעולה', palette: SAND },
    sourceExt: 'indd',
    versionNotes: ['כרטיס מודפס 15x10.5, נייר כרומו מט.', 'עדכנתי את הכותרת ואת הצבעים לפי הערות.', 'הוספתי ברכה אישית יותר וחיזקתי את הרימון.'],
    decisionNotes: ['הצבעים חלשים לדפוס, לחזק ניגודיות.', 'כמעט. החתימה יבשה מדי.', 'מאושר לדפוס. כל הכבוד!'],
    comments: [
      { v: 1, author: 'u2', text: 'הזהב הזה ייצא בוץ בדפוס, לבדוק מול הפנטון', pin: { x: 50, y: 50 }, resolved: true, h: 30 },
      { v: 2, author: 'u2', text: 'החתימה "בברכה" יבשה, אפשר משהו חם יותר', pin: { x: 80, y: 75 }, resolved: true, h: 22 },
    ],
  },
  {
    id: 'i4',
    title: 'קטלוג 2027 – עמוד שער',
    projectId: 'p2',
    designerId: 'u3',
    approverId: 'u2',
    dueIn: -2,
    createdDaysAgo: 5,
    status: 'pending',
    spec: { kind: 'catalog', title: 'קטלוג מוצרים 2027', subtitle: 'ניקוי, כביסה וחיטוי לתעשייה', palette: BLUE },
    sourceExt: 'indd',
    versionNotes: ['כפולת שער לקטלוג. התמונות זמניות עד הצילומים.'],
    decisionNotes: [],
    comments: [],
  },
  {
    id: 'i5',
    title: 'קטלוג 2027 – כפולת מוצרי ניקוי',
    projectId: 'p2',
    designerId: 'u6',
    approverId: 'u2',
    dueIn: -1,
    createdDaysAgo: 9,
    status: 'changes',
    spec: { kind: 'catalog', title: 'מוצרי ניקוי', subtitle: 'סדרת המקצוענים', palette: TEAL },
    sourceExt: 'indd',
    versionNotes: ['כפולה ראשונה של מוצרי ניקוי.', 'החלפתי מק״טים לפי הרשימה המעודכנת מהשיווק.'],
    decisionNotes: ['המק״טים לא תואמים לרשימה של השיווק.', 'עדיין חסר מחיר מומלץ, וכותרת הכפולה צריכה להיות ברורה יותר.'],
    comments: [
      { v: 1, author: 'u2', text: 'המק״טים כאן ישנים, לקחת מהקובץ של רונית', pin: { x: 82, y: 55 }, resolved: true, h: 25 },
      { v: 2, author: 'u2', text: 'חסר מחיר מומלץ מתחת לכל מוצר', pin: { x: 71, y: 64 }, h: 20 },
      { v: 2, author: 'u2', text: 'כותרת הכפולה צריכה להיות "סדרת המקצוענים" ולא "מוצרי ניקוי"', pin: { x: 85, y: 12 }, h: 20 },
      { v: 2, author: 'u6', text: 'מחכה למחירים מהשיווק, אעדכן ברגע שיגיעו', h: 28 },
    ],
  },
  {
    id: 'i6',
    title: 'פלייר מוצר – מסיר שומנים',
    projectId: 'p2',
    designerId: 'u4',
    approverId: 'u1',
    dueIn: -6,
    createdDaysAgo: 18,
    status: 'approved',
    spec: { kind: 'flyer', title: 'מסיר שומנים פרו', subtitle: 'למטבחים מוסדיים ומפעלי מזון', cta: 'להזמנות: 03-0000000', palette: TEAL },
    sourceExt: 'ai',
    versionNotes: ['פלייר A4 להפצה לסוכנים.', 'הוספתי בקבוק שלישי והזזתי את הרשימה.'],
    decisionNotes: ['האזור העליון ריק מדי.', 'מאושר.'],
    comments: [{ v: 1, author: 'u1', text: 'יש פה הרבה אוויר, אפשר להכניס עוד מוצר', pin: { x: 65, y: 25 }, resolved: true, h: 15 }],
  },
  {
    id: 'i7',
    title: 'סט אייקונים לתכונות מוצר',
    projectId: 'p2',
    designerId: 'u5',
    approverId: 'u1',
    dueIn: 5,
    createdDaysAgo: 4,
    status: 'rejected',
    spec: { kind: 'icons', title: 'אייקוני תכונות', palette: SLATE },
    sourceExt: 'ai',
    versionNotes: ['סט של 6 אייקונים לשימוש בקטלוג ובאתר.'],
    decisionNotes: ['כל האייקונים זהים (וי בעיגול) ולא מתקשרים את התכונה. צריך קונספט חדש לגמרי, נדבר בפגישה.'],
    comments: [{ v: 1, author: 'u1', text: 'למשל כאן: "ידידותי לסביבה" צריך עלה, לא וי', pin: { x: 80, y: 37 }, h: 10 }],
  },
  {
    id: 'i8',
    title: 'רולאפ כניסה לביתן',
    projectId: 'p3',
    designerId: 'u6',
    approverId: 'u1',
    dueIn: 0,
    createdDaysAgo: 2,
    status: 'pending',
    spec: { kind: 'rollup', title: 'פתרונות ניקוי מתקדמים', subtitle: 'בואו לראות הדגמה חיה', cta: 'ביתן 4 · דוכן B12', palette: SLATE },
    sourceExt: 'pdf',
    versionNotes: ['רולאפ 85x200, יוצא לדפוס ביום חמישי. חשוב לאשר היום.'],
    decisionNotes: [],
    comments: [],
  },
  {
    id: 'i9',
    title: 'שלט דוכן ראשי',
    projectId: 'p3',
    designerId: 'u3',
    approverId: 'u2',
    dueIn: -4,
    createdDaysAgo: 12,
    status: 'approved',
    spec: { kind: 'banner', title: 'גדות בתערוכת התעשייה', subtitle: 'ביתן 4 · דוכן B12', cta: 'הדגמה חיה', palette: BLUE },
    sourceExt: 'ai',
    versionNotes: ['שלט 3x1 מטר מעל הדוכן.', 'הגדלתי את הלוגו לקריאות מרחוק.'],
    decisionNotes: ['מרחוק לא קוראים כלום, להגדיל.', 'מעולה, מאושר לייצור.'],
    comments: [{ v: 1, author: 'u2', text: 'מ-10 מטר אי אפשר לקרוא את השורה הזו', pin: { x: 72, y: 56 }, resolved: true, h: 12 }],
  },
  {
    id: 'i10',
    title: 'פלייר לחלוקה בתערוכה',
    projectId: 'p3',
    designerId: 'u5',
    approverId: 'u1',
    dueIn: -1,
    createdDaysAgo: 7,
    status: 'pending',
    spec: { kind: 'flyer', title: 'פוגשים אותנו בתערוכה', subtitle: 'כל הפתרונות של גדות במקום אחד', cta: 'סרקו לקבלת הקטלוג', palette: SAND },
    sourceExt: 'indd',
    versionNotes: ['פלייר A5 דו-צדדי.', 'תיקנתי את סדר השורות והוספתי מוצר.'],
    decisionNotes: ['סדר השורות לא הגיוני, להתחיל מהמוצר המוביל.'],
    comments: [{ v: 1, author: 'u1', text: 'להתחיל מ"חיטוי וסניטציה", זה המוצר המוביל השנה', pin: { x: 75, y: 63 }, resolved: true, h: 16 }],
  },
  {
    id: 'i11',
    title: 'לוגו לקו "גדות פרו"',
    projectId: 'p4',
    designerId: 'u4',
    approverId: 'u2',
    dueIn: -10,
    createdDaysAgo: 25,
    status: 'approved',
    spec: { kind: 'logo', title: 'גדות פרו', subtitle: 'PROFESSIONAL LINE', palette: ['#ffffff', '#059669', '#052e16'] },
    sourceExt: 'ai',
    versionNotes: ['שלושה כיוונים, מצרף את הראשון.', 'כיוון מרובע, יותר "תעשייתי".', 'שילוב: עיגול עם קשת, ונקודה כסמל לטיפה.'],
    decisionNotes: ['עגול מדי, מרגיש צרכני ולא מקצועי.', 'קרוב, אבל קשיח מדי. לרכך.', 'זה הוא. מאושר.'],
    comments: [
      { v: 1, author: 'u2', text: 'הצורה הזו מזכירה מותג קוסמטיקה', pin: { x: 50, y: 37 }, resolved: true, h: 30 },
      { v: 2, author: 'u2', text: 'פינות פחות חדות, ואולי להוסיף אלמנט טיפה', pin: { x: 35, y: 25 }, resolved: true, h: 24 },
    ],
  },
  {
    id: 'i12',
    title: 'באנר לינקדאין – השקת גדות פרו',
    projectId: 'p4',
    designerId: 'u6',
    approverId: 'u1',
    dueIn: 6,
    createdDaysAgo: 1,
    status: 'pending',
    spec: { kind: 'banner', title: 'גדות פרו כבר כאן', subtitle: 'קו מקצועי חדש לתעשייה', cta: 'לגלות עוד', palette: TEAL },
    sourceExt: 'psd',
    versionNotes: ['באנר להשקה בלינקדאין, משתמש בלוגו המאושר.'],
    decisionNotes: [],
    comments: [],
  },
];

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function slug(title: string) {
  return title.replace(/[^֐-׿a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function createSeed(): AppState {
  const now = Date.now();
  const items: Item[] = [];
  const comments: Comment[] = [];
  const notifications: Notification[] = [];

  for (const s of seedItems) {
    const created = now - s.createdDaysAgo * DAY;
    const steps = s.versionNotes.length + (s.status === 'pending' ? 0.6 : 1);
    const step = (now - created) / (steps + 0.2);
    const versions: Version[] = [];
    const events: ItemEvent[] = [];

    s.versionNotes.forEach((note, idx) => {
      const n = idx + 1;
      const at = new Date(created + idx * step).toISOString();
      versions.push({
        id: `${s.id}-v${n}`,
        number: n,
        previewFileUrl: placeholderDataUrl({ ...s.spec, version: n }),
        previewFileName: `${slug(s.title)}_v${n}.svg`,
        previewMime: 'image/svg+xml',
        sourceFileName: s.sourceExt ? `${slug(s.title)}_v${n}.${s.sourceExt}` : undefined,
        note,
        uploadedAt: at,
      });
      events.push({
        id: `${s.id}-e-up${n}`,
        type: n === 1 ? 'uploaded' : 'version',
        authorId: s.designerId,
        at,
        versionNumber: n,
        text: note,
      });

      const decisionNote = s.decisionNotes[idx];
      const isLast = n === s.versionNotes.length;
      if (decisionNote) {
        const decidedStatus: Status = isLast ? s.status : 'changes';
        events.push({
          id: `${s.id}-e-dec${n}`,
          type: 'decision',
          authorId: s.approverId,
          at: new Date(created + idx * step + step * 0.8).toISOString(),
          versionNumber: n,
          status: decidedStatus,
          text: decisionNote,
        });
      }
    });

    s.comments.forEach((c, idx) => {
      const version = versions[c.v - 1];
      const at = new Date(new Date(version.uploadedAt).getTime() + Math.min(c.h * HOUR, step * 0.7)).toISOString();
      const id = `${s.id}-c${idx + 1}`;
      comments.push({
        id,
        itemId: s.id,
        versionId: version.id,
        authorId: c.author,
        text: c.text,
        pin: c.pin,
        createdAt: at,
        resolved: !!c.resolved,
      });
      events.push({ id: `${s.id}-e-${id}`, type: 'comment', authorId: c.author, at, versionNumber: c.v, text: c.text });
    });

    events.sort((a, b) => a.at.localeCompare(b.at));

    items.push({
      id: s.id,
      title: s.title,
      projectId: s.projectId,
      designerId: s.designerId,
      approverId: s.approverId,
      dueDate: isoDate(new Date(now + s.dueIn * DAY)),
      status: s.status,
      versions,
      createdAt: new Date(created).toISOString(),
      events,
    });
  }

  // התראות קיימות, כדי שהפעמון לא יהיה ריק בתחילת הדמו
  const n = (id: string, userId: string, kind: Notification['kind'], actorId: string | undefined, text: string, itemId: string, hoursAgo: number, read = false) =>
    notifications.push({ id, userId, kind, actorId, text, itemId, read, channel: USER_CHANNEL[userId], createdAt: new Date(now - hoursAgo * HOUR).toISOString() });

  n('n1', 'u1', 'new', 'u6', 'יוצא לדפוס היום, חשוב לאשר עד הצהריים', 'i8', 3);
  n('n2', 'u1', 'version', 'u3', 'הכותרת הוגדלה וה-CTA הוחלף לכהה', 'i1', 20);
  n('n3', 'u1', 'new', 'u6', '', 'i12', 22);
  n('n4', 'u1', 'version', 'u5', '', 'i10', 50, true);
  n('n5', 'u2', 'new', 'u3', '', 'i4', 90);
  n('n6', 'u2', 'overdue', undefined, 'העבודה עדיין מחכה להחלטה שלך', 'i4', 10);
  n('n7', 'u4', 'changes', 'u1', 'שתי הערות על התמונה', 'i2', 30);
  n('n8', 'u5', 'rejected', 'u1', 'צריך קונספט חדש לאייקונים', 'i7', 40);
  n('n9', 'u6', 'changes', 'u2', 'חסר מחיר מומלץ וכותרת לא נכונה', 'i5', 34);
  n('n10', 'u3', 'approved', 'u2', 'הקבצים נשמרו בארכיון', 'i9', 100, true);

  return {
    schema: SCHEMA_VERSION,
    tour: { archiveSeen: false },
    currentUserId: 'u1',
    users,
    projects,
    items,
    comments,
    notifications,
  };
}
