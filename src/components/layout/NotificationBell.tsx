import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, Bell, BellOff, Check, Layers, MessageSquare, RotateCcw, Send, X, type LucideIcon } from 'lucide-react';
import type { Notification } from '../../types';
import { useLookups, useStore } from '../../store/StoreProvider';
import { markAllRead, markRead } from '../../store/actions';
import { useClickOutside } from '../../hooks/useClickOutside';
import { channelOf } from '../../lib/status';
import { timeAgo } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import { ChannelTag } from '../ui/ChannelTag';
import { FileThumb } from '../ui/FileThumb';
import { LogoMark } from './Logo';

const KIND: Record<Notification['kind'], string> = {
  new: 'שליחה לאישור',
  version: 'גרסה חדשה',
  changes: 'בקשת תיקונים',
  approved: 'אישור',
  rejected: 'דחייה',
  overdue: 'תזכורת דדליין',
  reply: 'תגובה להערה שלך',
};

const KIND_TONE: Record<Notification['kind'], string> = {
  new: 'text-sky-700',
  version: 'text-violet-700',
  changes: 'text-amber-700',
  approved: 'text-emerald-700',
  rejected: 'text-red-700',
  overdue: 'text-red-700',
  reply: 'text-stone-600',
};

const KIND_ICON: Record<Notification['kind'], { icon: LucideIcon; cls: string }> = {
  new: { icon: Send, cls: 'bg-sky-500' },
  version: { icon: Layers, cls: 'bg-violet-500' },
  changes: { icon: RotateCcw, cls: 'bg-amber-500' },
  approved: { icon: Check, cls: 'bg-emerald-600' },
  rejected: { icon: X, cls: 'bg-red-600' },
  overdue: { icon: AlarmClock, cls: 'bg-red-600' },
  reply: { icon: MessageSquare, cls: 'bg-stone-500' },
};

export function NotificationBell() {
  const { state, update, currentUser } = useStore();
  const { userById } = useLookups();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);
  const navigate = useNavigate();

  const mine = state.notifications.filter((n) => n.userId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((n) => !n.read).length;
  const list = tab === 'unread' ? mine.filter((n) => !n.read) : mine;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-md transition ${open ? 'bg-stone-100 text-ink' : 'text-stone-500 hover:bg-stone-100 hover:text-ink'}`}
        aria-label={`התראות (${unread} חדשות)`}
        aria-expanded={open}
        data-testid="bell"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="num absolute -top-0.5 end-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal-500 px-1 text-[9px] font-semibold text-white ring-2 ring-white" data-testid="bell-count">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-pop fixed inset-x-2 top-[60px] z-50 flex max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-pop sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-[23rem]">
          <div className="flex items-center gap-4 border-b border-stone-200/80 px-4">
            {(
              [
                ['all', 'התראות'],
                ['unread', 'לא נקראו'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`-mb-px flex h-11 items-center gap-1.5 border-b text-sm transition ${tab === k ? 'border-ink font-medium text-ink' : 'border-transparent text-stone-500 hover:text-ink'}`}
              >
                {label}
                {k === 'unread' && unread > 0 && <span className="num text-xs text-stone-400">{unread}</span>}
              </button>
            ))}
            {unread > 0 && (
              <button onClick={() => update((s) => markAllRead(s, currentUser.id))} className="ms-auto text-xs text-stone-500 transition hover:text-ink">
                סימון הכל כנקרא
              </button>
            )}
          </div>

          <div className="scroll-thin flex-1 overflow-y-auto">
            {list.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
                  <BellOff className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="text-sm font-medium">{tab === 'unread' ? 'הכל נקרא' : 'אין התראות'}</div>
                <div className="mt-1 text-xs text-stone-500">כשמשהו יחכה לך, הוא יופיע כאן.</div>
              </div>
            ) : (
              list.map((n) => {
                const item = state.items.find((i) => i.id === n.itemId);
                const v = item?.versions[item.versions.length - 1];
                const actor = n.actorId ? userById.get(n.actorId) : undefined;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      update((s) => markRead(s, n.id));
                      setOpen(false);
                      if (item) navigate(`/item/${item.id}`);
                    }}
                    className="relative flex w-full items-start gap-3 border-b border-stone-100 px-4 py-3 text-start transition last:border-0 hover:bg-stone-50"
                    data-testid="notification"
                  >
                    {!n.read && <span className="absolute start-1.5 top-[22px] h-1.5 w-1.5 rounded-full bg-signal-500" />}
                    <span className="relative shrink-0">
                      {actor ? <Avatar user={actor} /> : <LogoMark size={28} />}
                      {(() => {
                        const K = KIND_ICON[n.kind];
                        return (
                          <span className={`absolute -bottom-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full text-white ring-2 ring-white ${K.cls}`}>
                            <K.icon className="h-2.5 w-2.5" strokeWidth={2.5} />
                          </span>
                        );
                      })()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-5 text-stone-600">
                        <span className="font-medium text-ink">{actor?.name ?? 'גדות סטודיו'}</span>
                        <span className={`ms-1.5 ${KIND_TONE[n.kind]}`}>{KIND[n.kind]}</span>
                      </span>
                      <span className={`block truncate text-sm leading-5 ${n.read ? 'text-stone-600' : 'text-ink'}`}>{item?.title}</span>
                      {n.text && <span className="mt-0.5 block truncate text-xs text-stone-500">{n.text}</span>}
                      <span className="mt-1.5 flex items-center gap-2 text-xs text-stone-400">
                        <span>{timeAgo(n.createdAt)}</span>
                        <ChannelTag channel={n.channel} />
                      </span>
                    </span>
                    {v && <FileThumb version={v} className="h-10 w-12 shrink-0 rounded border border-stone-200 bg-stone-50 p-0.5" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-stone-200/80 bg-stone-50 px-4 py-2.5 text-xs text-stone-500">
            <ChannelTag channel={channelOf(currentUser.id)} />
            <span>בגרסה המלאה, כל התראה תגיע גם לערוץ הזה.</span>
          </div>
        </div>
      )}
    </div>
  );
}
