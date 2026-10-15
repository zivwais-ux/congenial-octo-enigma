import type { Channel, Status } from '../types';

export const STATUS_ORDER: Status[] = ['pending', 'changes', 'approved', 'rejected'];

export const STATUS_META: Record<
  Status,
  { label: string; badge: string; dot: string; soft: string; ring: string }
> = {
  pending: {
    label: 'ממתין לאישור',
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    dot: 'bg-sky-500',
    soft: 'bg-sky-50',
    ring: 'ring-sky-200',
  },
  changes: {
    label: 'נדרשים תיקונים',
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/25',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50',
    ring: 'ring-amber-200',
  },
  approved: {
    label: 'מאושר',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-50',
    ring: 'ring-emerald-200',
  },
  rejected: {
    label: 'נדחה',
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    dot: 'bg-rose-500',
    soft: 'bg-rose-50',
    ring: 'ring-rose-200',
  },
};

/** הערוץ שבו כל משתמש "מקבל" התראות בדמו – כדי להמחיש שההתראה מגיעה לאן שהוא כבר נמצא */
export const USER_CHANNEL: Record<string, Channel> = {
  u1: 'Teams',
  u2: 'וואטסאפ',
  u3: 'מייל',
  u4: 'וואטסאפ',
  u5: 'Teams',
  u6: 'מייל',
};

export const CHANNEL_META: Record<Channel, string> = {
  מייל: 'bg-slate-100 text-slate-700',
  Teams: 'bg-indigo-50 text-indigo-700',
  וואטסאפ: 'bg-green-50 text-green-700',
};
