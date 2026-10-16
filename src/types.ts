// הטיפוסים נגזרים אוטומטית מהסכמה ב-schema.ts, כך שההגדרה והבדיקה בזמן ריצה
// תמיד זהות. כדי לשנות מבנה נתונים – משנים את הסכמה, לא את הקובץ הזה.
import type { z } from 'zod';
import type {
  AppStateSchema,
  ChannelSchema,
  CommentSchema,
  ItemEventSchema,
  ItemEventTypeSchema,
  ItemSchema,
  NotificationKindSchema,
  NotificationSchema,
  PinSchema,
  ProjectSchema,
  RoleSchema,
  StatusSchema,
  TourStateSchema,
  BrandCheckSchema,
  UserSchema,
  VersionSchema,
} from './schema';

export type Role = z.infer<typeof RoleSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type User = z.infer<typeof UserSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Version = z.infer<typeof VersionSchema>;
export type ItemEventType = z.infer<typeof ItemEventTypeSchema>;
export type ItemEvent = z.infer<typeof ItemEventSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Pin = z.infer<typeof PinSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type NotificationKind = z.infer<typeof NotificationKindSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type TourState = z.infer<typeof TourStateSchema>;
export type BrandCheck = z.infer<typeof BrandCheckSchema>;
export type AppState = z.infer<typeof AppStateSchema>;
