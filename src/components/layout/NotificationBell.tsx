import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCheck, Mail, MessageCircle, Users } from 'lucide-react';
import type { Channel } from '../../types';
import { useStore } from '../../store/StoreProvider';
import { markAllRead, markRead } from '../../store/actions';
import { useClickOutside } from '../../hooks/useClickOutside';
import { CHANNEL_META, USER_CHANNEL } from '../../lib/status';
import { timeAgo } from '../../lib/dates';
import { FileThumb } from '../ui/FileThumb';

const CHANNEL_ICON: Record<Channel, typeof Mail> = { מייל: Mail, Teams: Users, וואטסאפ: MessageCircle };

export function ChannelTag({ channel }: { channel: Channel }) {
  const Icon = CHANNEL_ICON[channel];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${CHANNEL_META[channel]}`} data-testid="channel-tag">
      <Icon className="h-3 w-3" />
      {channel}
    </span>
  );
}

export function NotificationBell() {
  const { state, update, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);
  const navigate = useNavigate();

  const mine = state.notifications
    .filter((n) => n.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((n) => !n.read).length;
  const myChannel = USER_CHANNEL[currentUser.id] ?? 'מייל';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label={`התראות (${unread} חדשות)`}
        aria-expanded={open}
        data-testid="bell"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white" data-testid="bell-count">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-14 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="font-semibold text-slate-900">התראות</span>
            {unread > 0 && (
              <button
                onClick={() => update((s) => markAllRead(s, currentUser.id))}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                סמן הכל כנקרא
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {mine.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-sm text-slate-400">
                <BellOff className="h-7 w-7" />
                אין התראות
              </div>
            ) : (
              mine.map((n) => {
                const item = state.items.find((i) => i.id === n.itemId);
                const v = item?.versions[item.versions.length - 1];
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      update((s) => markRead(s, n.id));
                      setOpen(false);
                      if (item) navigate(`/item/${item.id}`);
                    }}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-start transition hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50/50'}`}
                    data-testid="notification"
                  >
                    {v ? <FileThumb version={v} className="h-10 w-12 shrink-0 rounded" /> : <span className="h-10 w-12 shrink-0 rounded bg-slate-100" />}
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm leading-snug ${n.read ? 'text-slate-600' : 'font-medium text-slate-900'}`}>{n.text}</span>
                      <span className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                        {timeAgo(n.createdAt)}
                        <span className="text-slate-300">·</span>
                        <span>נשלח גם ב-</span>
                        <ChannelTag channel={n.channel} />
                      </span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
            <ChannelTag channel={myChannel} />
            <span>במערכת האמיתית ההתראות יגיעו גם לערוץ הזה, שבו כבר עובדים ביום-יום.</span>
          </div>
        </div>
      )}
    </div>
  );
}
