import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, MessageCircle, Users, X } from 'lucide-react';
import type { Notification } from '../../types';
import { useLookups, useStore } from '../../store/StoreProvider';
import { useSwitchUser } from '../../hooks/useSwitchUser';
import { NOTIFICATION_LABEL } from '../../lib/notifications';
import { FileThumb } from '../ui/FileThumb';
import { useUI } from './UIContext';

const SHOW_MS = 5500;
/** התראה שנוצרה לפני יותר מזה (נתוני דמה, איפוס) לא "נשלחת" עכשיו */
const FRESH_MS = 15_000;

/**
 * הדמיה של ההודעה שהנמען מקבל בערוץ שלו (מייל / Teams / וואטסאפ).
 * מאזין להתראות חדשות ב-state, ומציג אחת בכל פעם.
 */
export function DeliveryPreview() {
  const { state } = useStore();
  const { deliveryPreviews } = useUI();
  const seen = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(state.notifications.map((n) => n.id));
      return;
    }
    const fresh = state.notifications.filter((n) => !seen.current!.has(n.id));
    fresh.forEach((n) => seen.current!.add(n.id));
    const toShow = fresh.filter((n) => n.userId !== state.currentUserId && Date.now() - Date.parse(n.createdAt) < FRESH_MS);
    if (deliveryPreviews && toShow.length) setQueue((q) => [...q, ...toShow.map((n) => n.id)]);
  }, [state.notifications, state.currentUserId, deliveryPreviews]);

  // התראה שבוטלה (Undo) יוצאת מהתור
  const ids = new Set(state.notifications.map((n) => n.id));
  const visible = queue.filter((id) => ids.has(id));
  const current = deliveryPreviews ? state.notifications.find((n) => n.id === visible[0]) : undefined;

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  useEffect(() => {
    if (!deliveryPreviews) setQueue([]);
  }, [deliveryPreviews]);

  useEffect(() => {
    if (visible.length !== queue.length) setQueue(visible);
  }, [visible, queue.length]);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(dismiss, SHOW_MS);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  if (!current) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] lg:inset-x-auto lg:end-4 lg:top-[60px] lg:px-0 lg:pt-0"
      aria-live="polite"
    >
      <Card key={current.id} n={current} onDismiss={dismiss} />
    </div>
  );
}

function Card({ n, onDismiss }: { n: Notification; onDismiss: () => void }) {
  const { state } = useStore();
  const { userById } = useLookups();
  const switchUser = useSwitchUser();
  const navigate = useNavigate();
  const recipient = userById.get(n.userId);
  const actor = n.actorId ? userById.get(n.actorId) : undefined;
  const item = state.items.find((i) => i.id === n.itemId);
  if (!recipient || !item) return null;

  const latest = item.versions[item.versions.length - 1];
  const headline = `${actor ? `${actor.name} · ` : ''}${NOTIFICATION_LABEL[n.kind]}`;
  const open = () => {
    switchUser(recipient.id, true);
    navigate(`/item/${item.id}`);
    onDismiss();
  };

  const thumb = <FileThumb version={latest} className="h-11 w-14 shrink-0 rounded-md border border-black/5 bg-stone-100 p-1" />;
  const body = (
    <div className="flex items-center gap-2.5">
      {thumb}
      <div className="min-w-0 flex-1 leading-snug">
        <div className="truncate text-sm font-medium text-ink">{item.title}</div>
        {n.text && <div className="line-clamp-2 text-xs text-stone-600">{n.text}</div>}
      </div>
    </div>
  );
  const openBtn = (cls: string) => (
    <button onClick={open} className={`h-7 rounded-md px-2.5 text-xs font-medium transition ${cls}`} data-testid="delivery-open">
      פתיחה
    </button>
  );

  return (
    <div className="anim-pop pointer-events-auto w-full max-w-sm" data-testid="delivery-preview" data-channel={n.channel}>
      <div className="mb-1.5 flex items-center justify-between gap-2 rounded-md bg-white/95 px-2 py-1 text-2xs text-stone-500 shadow-xs ring-1 ring-black/5 backdrop-blur">
        <span className="truncate">
          הדמיה: כך זה מגיע ל{recipient.name} ב{n.channel === 'מייל' ? 'מייל' : `-${n.channel}`}
        </span>
        <button onClick={onDismiss} className="shrink-0 rounded p-0.5 text-stone-400 transition hover:text-ink" aria-label="סגירה">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {n.channel === 'וואטסאפ' && (
        <div className="overflow-hidden rounded-xl border border-black/5 bg-[#ece5dd] p-2.5 shadow-pop">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs text-stone-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25a35a] text-white">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-ink">גדות סטודיו</span>
          </div>
          <div className="relative max-w-[92%] rounded-lg rounded-ss-none bg-white p-2.5 shadow-xs">
            <div className="mb-1.5 text-xs font-medium text-[#1f8a4c]">{headline}</div>
            {body}
            <div className="mt-2 flex items-center justify-between">
              {openBtn('bg-[#e7f6ec] text-[#1f6e40] hover:bg-[#d5efdf]')}
              <span className="num text-2xs text-stone-400">עכשיו ✓✓</span>
            </div>
          </div>
        </div>
      )}

      {n.channel === 'Teams' && (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-pop">
          <div className="flex">
            <div className="w-1 shrink-0 bg-[#5b5fc7]" />
            <div className="min-w-0 flex-1 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#eef0fb] text-[#5b5fc7]">
                  <Users className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium text-ink">גדות סטודיו</span>
                <span className="text-stone-400">· אישורי עיצוב</span>
              </div>
              <div className="mb-2 text-sm font-semibold text-ink">{headline}</div>
              {body}
              <div className="mt-2.5">{openBtn('bg-[#5b5fc7] text-white hover:bg-[#4e52b5]')}</div>
            </div>
          </div>
        </div>
      )}

      {n.channel === 'מייל' && (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-pop">
          <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-3 py-2 text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-stone-600">
              <AtSign className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-medium text-ink">גדות סטודיו</span>
              <span className="block truncate text-stone-500">אל: {recipient.name}</span>
            </span>
            <span className="text-2xs text-stone-400">עכשיו</span>
          </div>
          <div className="p-3">
            <div className="mb-2 truncate text-sm font-semibold text-ink">
              {NOTIFICATION_LABEL[n.kind]}: {item.title}
            </div>
            {body}
            {actor && <div className="mt-2 text-xs text-stone-500">נשלח על ידי {actor.name}</div>}
            <div className="mt-2.5">{openBtn('border border-stone-300 bg-white text-ink hover:bg-stone-50')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
