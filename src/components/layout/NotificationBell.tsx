import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlarmClock, Bell, BellOff, CheckCheck, CheckCircle2, Layers, Send, Wrench, XCircle } from 'lucide-react';
import type { Notification } from '../../types';
import { useLookups, useStore } from '../../store/StoreProvider';
import { markAllRead, markRead } from '../../store/actions';
import { useClickOutside } from '../../hooks/useClickOutside';
import { channelOf } from '../../lib/status';
import { timeAgo } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import { ChannelTag } from '../ui/ChannelTag';
import { FileThumb } from '../ui/FileThumb';

const KIND: Record<Notification['kind'], { label: string; icon: typeof Bell; cls: string }> = {
  new: { label: 'שליחה לאישור', icon: Send, cls: 'bg-sky-100 text-sky-700' },
  version: { label: 'גרסה חדשה', icon: Layers, cls: 'bg-indigo-100 text-indigo-700' },
  changes: { label: 'בקשת תיקונים', icon: Wrench, cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'אישור', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'דחייה', icon: XCircle, cls: 'bg-rose-100 text-rose-700' },
  overdue: { label: 'תזכורת דדליין', icon: AlarmClock, cls: 'bg-rose-100 text-rose-700' },
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
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition ${open ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
        aria-label={`התראות (${unread} חדשות)`}
        aria-expanded={open}
        data-testid="bell"
      >
        <Bell className="h-[19px] w-[19px]" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 end-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
            data-testid="bell-count"
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-pop fixed inset-x-2 top-16 z-50 flex max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-pop sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-[25rem]">
          <div className="flex items-center gap-3 border-b border-zinc-100 px-4 pt-3">
            <span className="pb-3 text-[15px] font-bold text-zinc-900">התראות</span>
            <div className="ms-2 flex gap-1 self-end">
              {(
                [
                  ['all', 'הכל'],
                  ['unread', `לא נקראו${unread ? ` · ${unread}` : ''}`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`-mb-px border-b-2 px-2 pb-2.5 text-[13px] font-medium transition ${tab === k ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {unread > 0 && (
              <button
                onClick={() => update((s) => markAllRead(s, currentUser.id))}
                className="mb-3 ms-auto flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                סימון הכל כנקרא
              </button>
            )}
          </div>

          <div className="scroll-thin flex-1 overflow-y-auto">
            {list.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                  <BellOff className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-zinc-800">{tab === 'unread' ? 'קראת הכל' : 'אין התראות עדיין'}</span>
                <span className="text-xs text-zinc-500">כשמשהו יחכה לך, הוא יופיע כאן.</span>
              </div>
            ) : (
              list.map((n) => {
                const item = state.items.find((i) => i.id === n.itemId);
                const v = item?.versions[item.versions.length - 1];
                const actor = n.actorId ? userById.get(n.actorId) : undefined;
                const k = KIND[n.kind];
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      update((s) => markRead(s, n.id));
                      setOpen(false);
                      if (item) navigate(`/item/${item.id}`);
                    }}
                    className={`group relative flex w-full items-start gap-3 border-b border-zinc-100 px-4 py-3.5 text-start transition last:border-0 hover:bg-zinc-50 ${n.read ? '' : 'bg-brand-50/40'}`}
                    data-testid="notification"
                  >
                    <span className="relative shrink-0">
                      {actor ? (
                        <Avatar user={actor} ring={false} />
                      ) : (
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${k.cls}`}>
                          <k.icon className="h-4 w-4" />
                        </span>
                      )}
                      {actor && (
                        <span className={`absolute -bottom-1 -end-1 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-2 ring-white ${k.cls}`}>
                          <k.icon className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-snug text-zinc-600">
                        {actor && <span className="font-semibold text-zinc-900">{actor.name} · </span>}
                        {k.label}
                      </span>
                      <span className={`mt-0.5 block truncate text-sm ${n.read ? 'text-zinc-700' : 'font-semibold text-zinc-900'}`}>{item?.title}</span>
                      {n.text && <span className="mt-0.5 block truncate text-xs text-zinc-500">{n.text}</span>}
                      <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                        {timeAgo(n.createdAt)}
                        <span className="text-zinc-300">·</span>
                        נשלח גם ל
                        <ChannelTag channel={n.channel} />
                      </span>
                    </span>
                    {v && <FileThumb version={v} className="checker h-11 w-14 shrink-0 rounded-md ring-1 ring-zinc-200" />}
                    {!n.read && <span className="absolute end-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-start gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 text-[11px] leading-relaxed text-zinc-500">
            <span className="mt-px shrink-0">
              <ChannelTag channel={channelOf(currentUser.id)} />
            </span>
            <span>במערכת האמיתית כל התראה תגיע גם לערוץ שבו כבר עובדים. כאן מוצג הערוץ שהוגדר לך.</span>
          </div>
        </div>
      )}
    </div>
  );
}
