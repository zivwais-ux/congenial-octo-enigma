import type { Channel, Status } from '../types';

export const STATUS_ORDER: Status[] = ['pending', 'changes', 'approved', 'rejected'];

/** צבע עקבי לכל סטטוס, בכל מקום באפליקציה */
export const STATUS_META: Record<Status, { label: string; badge: string; dot: string; soft: string; text: string }> = {
  pending: {
    label: 'ממתין לאישור',
    badge: 'bg-sky-50 text-sky-800',
    dot: 'bg-sky-600',
    soft: 'bg-sky-50',
    text: 'text-sky-700',
  },
  changes: {
    label: 'נדרשים תיקונים',
    badge: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
  },
  approved: {
    label: 'מאושר',
    badge: 'bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-600',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  rejected: {
    label: 'נדחה',
    badge: 'bg-red-50 text-red-800',
    dot: 'bg-red-600',
    soft: 'bg-rose-50',
    text: 'text-rose-700',
  },
};

/** הערוץ שבו כל משתמש "מקבל" התראות בדמו – כדי להמחיש שההתראה מגיעה לאן שכבר עובדים */
export const USER_CHANNEL: Record<string, Channel> = {
  u1: 'Teams',
  u2: 'וואטסאפ',
  u3: 'מייל',
  u4: 'וואטסאפ',
  u5: 'Teams',
  u6: 'מייל',
};

export function channelOf(userId: string): Channel {
  return USER_CHANNEL[userId] ?? 'מייל';
}
