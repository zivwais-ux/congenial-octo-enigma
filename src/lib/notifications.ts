import type { Notification } from '../types';

/** שם הפעולה של כל סוג התראה (בלי שם המבצע – כך הניסוח לא תלוי במגדר) */
export const NOTIFICATION_LABEL: Record<Notification['kind'], string> = {
  new: 'שליחה לאישור',
  version: 'גרסה חדשה',
  changes: 'בקשת תיקונים',
  approved: 'אישור',
  rejected: 'דחייה',
  overdue: 'תזכורת דדליין',
  reply: 'תגובה להערה שלך',
};
