import { Check, Clock3, RotateCcw, X, type LucideIcon } from 'lucide-react';
import type { Channel, Status } from '../types';

export const STATUS_ORDER: Status[] = ['pending', 'changes', 'approved', 'rejected'];

/** צבע עקבי לכל סטטוס, בכל מקום באפליקציה */
export const STATUS_META: Record<Status, { label: string; badge: string; dot: string; soft: string; text: string; icon: LucideIcon; tone: Tone }> = {
  pending: {
    label: 'ממתין לאישור',
    badge: 'bg-sky-50 text-sky-800',
    dot: 'bg-sky-600',
    soft: 'bg-sky-50',
    text: 'text-sky-700',
    icon: Clock3,
    tone: 'sky',
  },
  changes: {
    label: 'נדרשים תיקונים',
    badge: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
    icon: RotateCcw,
    tone: 'amber',
  },
  approved: {
    label: 'מאושר',
    badge: 'bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-600',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: Check,
    tone: 'emerald',
  },
  rejected: {
    label: 'נדחה',
    badge: 'bg-red-50 text-red-800',
    dot: 'bg-red-600',
    soft: 'bg-rose-50',
    text: 'text-rose-700',
    icon: X,
    tone: 'red',
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

/** גוונים עדינים לאייקונים ולתגיות */
export type Tone = 'sky' | 'amber' | 'emerald' | 'red' | 'violet' | 'stone' | 'signal' | 'teal';

export const TONE: Record<Tone, { tile: string; fg: string }> = {
  sky: { tile: 'bg-sky-50 text-sky-700 ring-sky-100', fg: 'text-sky-600' },
  amber: { tile: 'bg-amber-50 text-amber-700 ring-amber-100', fg: 'text-amber-600' },
  emerald: { tile: 'bg-emerald-50 text-emerald-700 ring-emerald-100', fg: 'text-emerald-600' },
  red: { tile: 'bg-red-50 text-red-700 ring-red-100', fg: 'text-red-600' },
  violet: { tile: 'bg-violet-50 text-violet-700 ring-violet-100', fg: 'text-violet-600' },
  teal: { tile: 'bg-teal-50 text-teal-700 ring-teal-100', fg: 'text-teal-600' },
  stone: { tile: 'bg-stone-100 text-stone-600 ring-stone-200/70', fg: 'text-stone-500' },
  signal: { tile: 'bg-signal-50 text-signal-700 ring-signal-100', fg: 'text-signal-600' },
};
