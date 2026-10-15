import { useEffect, useRef, useState } from 'react';
import { Check, CornerDownLeft, MapPin, MessageSquareDashed } from 'lucide-react';
import type { Comment } from '../../types';
import { useLookups } from '../../store/StoreProvider';
import { timeAgo } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import type { NumberedPin } from './PreviewPane';

interface Props {
  pinned: NumberedPin[];
  general: Comment[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onToggleResolved: (id: string) => void;
  onAddGeneral: (text: string) => void;
  showResolved: boolean;
  onShowResolved: (v: boolean) => void;
  olderCount: number;
  canPin: boolean;
}

export function CommentPanel(p: Props) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // גלילה להערה שנבחרה מתוך ה-pin
  useEffect(() => {
    if (!p.activeId) return;
    listRef.current?.querySelector(`[data-comment="${p.activeId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [p.activeId]);

  const resolvedCount = [...p.pinned.map((x) => x.comment), ...p.general].filter((c) => c.resolved).length;
  const pinned = p.pinned.filter((x) => p.showResolved || !x.comment.resolved || x.comment.id === p.activeId);
  const general = p.general.filter((c) => p.showResolved || !c.resolved);
  const empty = pinned.length === 0 && general.length === 0;

  const submit = () => {
    if (!text.trim()) return;
    p.onAddGeneral(text.trim());
    setText('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} className="scroll-thin flex-1 space-y-5 overflow-y-auto p-4">
        {resolvedCount > 0 && (
          <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-zinc-500">
            <input type="checkbox" checked={p.showResolved} onChange={(e) => p.onShowResolved(e.target.checked)} className="h-3.5 w-3.5 rounded border-zinc-300 accent-zinc-900" />
            להציג גם הערות שטופלו ({resolvedCount})
          </label>
        )}

        {empty && (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
              <MessageSquareDashed className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-semibold text-zinc-800">{resolvedCount ? 'כל ההערות טופלו' : 'אין עדיין הערות על הגרסה הזו'}</span>
            <span className="mt-1 max-w-[16rem] text-xs leading-relaxed text-zinc-500">
              {p.canPin ? 'לחצו על נקודה בעבודה כדי להשאיר הערה מדויקת, או כתבו הערה כללית למטה.' : 'הערות כלליות אפשר תמיד לכתוב למטה.'}
            </span>
          </div>
        )}

        {pinned.length > 0 && (
          <Group title="על העבודה" count={pinned.length}>
            {pinned.map(({ comment, number }) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                number={number}
                active={comment.id === p.activeId}
                onClick={() => p.onSelect(comment.id === p.activeId ? null : comment.id)}
                onToggle={() => p.onToggleResolved(comment.id)}
              />
            ))}
          </Group>
        )}

        {general.length > 0 && (
          <Group title="הערות כלליות" count={general.length}>
            {general.map((c) => (
              <CommentRow key={c.id} comment={c} onToggle={() => p.onToggleResolved(c.id)} />
            ))}
          </Group>
        )}

        {p.olderCount > 0 && <p className="text-center text-[11px] text-zinc-400">עוד {p.olderCount === 1 ? 'הערה אחת' : `${p.olderCount} הערות`} בגרסאות קודמות</p>}
      </div>

      <div className="border-t border-zinc-200 bg-white p-3">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm shadow-zinc-900/[0.02] transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="הערה כללית על הגרסה…"
            className="block max-h-32 w-full resize-none bg-transparent px-3 pt-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            data-testid="general-comment-input"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="ps-1 text-[11px] text-zinc-400">Enter לשליחה · Shift+Enter לשורה חדשה</span>
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="flex h-7 items-center gap-1 rounded-md bg-zinc-900 px-2.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-25"
            >
              שליחה
              <CornerDownLeft className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
        {title}
        <span className="text-zinc-300">{count}</span>
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CommentRow({ comment, number, active, onClick, onToggle }: { comment: Comment; number?: number; active?: boolean; onClick?: () => void; onToggle: () => void }) {
  const { userById } = useLookups();
  const author = userById.get(comment.authorId);
  return (
    <div
      data-comment={comment.id}
      data-testid="comment"
      onClick={onClick}
      className={`group rounded-xl border p-3 transition ${onClick ? 'cursor-pointer' : ''} ${
        active ? 'border-brand-300 bg-brand-50/60 ring-4 ring-brand-500/10' : 'border-zinc-200 bg-white hover:border-zinc-300'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {author && <Avatar user={author} size="sm" ring={false} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-zinc-900">{author?.name}</span>
            <span className="text-zinc-400">{timeAgo(comment.createdAt)}</span>
            {number !== undefined && (
              <span
                className={`ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                  active ? 'bg-brand-600' : comment.resolved ? 'bg-zinc-400' : 'bg-rose-500'
                }`}
                title="מספר הסימון על העבודה"
              >
                {number}
              </span>
            )}
          </div>
          <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${comment.resolved ? 'text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-700'}`}>{comment.text}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold transition ${
                comment.resolved ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
              data-testid="resolve-btn"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              {comment.resolved ? 'טופל' : 'סימון כטופל'}
            </button>
            {number !== undefined && onClick && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 opacity-0 transition group-hover:opacity-100">
                <MapPin className="h-3 w-3" />
                {active ? 'מודגש על העבודה' : 'להדגשה על העבודה'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
