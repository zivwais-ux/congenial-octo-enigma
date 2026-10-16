// הגדרת מבנה הנתונים של האפליקציה, במקום אחד.
// מכאן נגזרים גם הטיפוסים של TypeScript (types.ts) וגם הבדיקה בזמן ריצה
// של כל מה שמגיע "מבחוץ" – כרגע: הנתונים השמורים בדפדפן.
import { z } from 'zod';

const id = z.string().min(1);
/** תאריך ושעה בפורמט ISO */
const isoDateTime = z.string().datetime({ offset: true });
/** תאריך בלבד: YYYY-MM-DD */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך בפורמט YYYY-MM-DD');
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'צבע בפורמט #rrggbb');
/** קישור לקובץ: נתוני דמה (data:), קובץ שהועלה (idb://) או object URL זמני (blob:) */
const fileRef = z.string().regex(/^(data:|idb:\/\/|blob:)/, 'קישור קובץ לא מוכר');

export const RoleSchema = z.enum(['designer', 'approver']);
export const StatusSchema = z.enum(['pending', 'changes', 'approved', 'rejected']);
export const ChannelSchema = z.enum(['מייל', 'Teams', 'וואטסאפ']);
export const ItemEventTypeSchema = z.enum(['uploaded', 'version', 'comment', 'decision']);
export const NotificationKindSchema = z.enum(['new', 'version', 'approved', 'changes', 'rejected', 'overdue']);

export const UserSchema = z.object({
  id,
  name: z.string().min(1),
  role: RoleSchema,
  /** ראשי תיבות לאווטאר */
  avatar: z.string().min(1).max(3),
  /** תפקיד לתצוגה, למשל "מנהלת מחלקת עיצוב" */
  title: z.string(),
  color: hexColor,
});

export const ProjectSchema = z.object({
  id,
  name: z.string().min(1),
  color: hexColor,
});

export const VersionSchema = z.object({
  id,
  number: z.number().int().positive(),
  previewFileUrl: fileRef,
  previewFileName: z.string().min(1),
  previewMime: z.string().min(1),
  sourceFileName: z.string().optional(),
  /** idb://<id> כשהמעצב העלה קובץ מקור אמיתי */
  sourceFileUrl: fileRef.optional(),
  note: z.string(),
  uploadedAt: isoDateTime,
});

export const ItemEventSchema = z.object({
  id,
  type: ItemEventTypeSchema,
  authorId: id,
  at: isoDateTime,
  versionNumber: z.number().int().positive().optional(),
  status: StatusSchema.optional(),
  text: z.string().optional(),
});

export const ItemSchema = z.object({
  id,
  title: z.string().min(1),
  projectId: id,
  designerId: id,
  approverId: id,
  dueDate: isoDate,
  status: StatusSchema,
  versions: z.array(VersionSchema).min(1, 'לכל עבודה צריכה להיות לפחות גרסה אחת'),
  createdAt: isoDateTime,
  events: z.array(ItemEventSchema),
});

export const PinSchema = z.object({
  /** אחוזים מרוחב/גובה התמונה */
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const CommentSchema = z.object({
  id,
  itemId: id,
  versionId: id,
  authorId: id,
  text: z.string().min(1),
  pin: PinSchema.optional(),
  createdAt: isoDateTime,
  resolved: z.boolean(),
});

export const NotificationSchema = z.object({
  id,
  userId: id,
  kind: NotificationKindSchema,
  /** מי ביצע את הפעולה (אין במקרה של תזכורת מערכת) */
  actorId: id.optional(),
  /** פירוט קצר (לא חובה); הכותרת נגזרת מסוג ההתראה ומשם העבודה */
  text: z.string(),
  itemId: id,
  read: z.boolean(),
  channel: ChannelSchema,
  createdAt: isoDateTime,
});

export const TourStateSchema = z.object({
  /** האם הארכיון נפתח אחרי שעבודת ההדגמה אושרה */
  archiveSeen: z.boolean(),
});

export const AppStateSchema = z
  .object({
    schema: z.number().int(),
    tour: TourStateSchema,
    currentUserId: id,
    users: z.array(UserSchema).min(1),
    projects: z.array(ProjectSchema).min(1),
    items: z.array(ItemSchema),
    comments: z.array(CommentSchema),
    notifications: z.array(NotificationSchema),
  })
  // מעבר לצורה של כל רשומה – בודקים שההפניות בין הרשומות תקינות,
  // כדי שמסך לא יקרוס על עבודה שמפנה למשתמש או לפרויקט שלא קיים
  .superRefine((s, ctx) => {
    const users = new Map(s.users.map((u) => [u.id, u]));
    const projects = new Set(s.projects.map((p) => p.id));
    const items = new Map(s.items.map((i) => [i.id, i]));
    const fail = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

    if (!users.has(s.currentUserId)) fail(['currentUserId'], 'המשתמש הנוכחי לא קיים');

    s.items.forEach((item, i) => {
      if (!projects.has(item.projectId)) fail(['items', i, 'projectId'], `פרויקט לא קיים: ${item.projectId}`);
      if (users.get(item.designerId)?.role !== 'designer') fail(['items', i, 'designerId'], `מעצב לא קיים: ${item.designerId}`);
      if (users.get(item.approverId)?.role !== 'approver') fail(['items', i, 'approverId'], `מאשר לא קיים: ${item.approverId}`);
      item.versions.forEach((v, vi) => {
        if (v.number !== vi + 1) fail(['items', i, 'versions', vi, 'number'], 'מספור הגרסאות לא רציף');
      });
    });

    s.comments.forEach((c, i) => {
      const item = items.get(c.itemId);
      if (!item) fail(['comments', i, 'itemId'], `עבודה לא קיימת: ${c.itemId}`);
      else if (!item.versions.some((v) => v.id === c.versionId)) fail(['comments', i, 'versionId'], `גרסה לא קיימת: ${c.versionId}`);
      if (!users.has(c.authorId)) fail(['comments', i, 'authorId'], `כותב לא קיים: ${c.authorId}`);
    });

    s.notifications.forEach((n, i) => {
      if (!users.has(n.userId)) fail(['notifications', i, 'userId'], `נמען לא קיים: ${n.userId}`);
      if (!items.has(n.itemId)) fail(['notifications', i, 'itemId'], `עבודה לא קיימת: ${n.itemId}`);
    });
  });

/** תיאור קצר וקריא של הבעיות, לקונסול */
export function describeIssues(error: z.ZodError, max = 5) {
  return error.issues
    .slice(0, max)
    .map((i) => `${i.path.join('.') || '(שורש)'}: ${i.message}`)
    .join('\n');
}
