import { useEffect, useRef, useState } from 'react';
import { Check, MapPin, MessageSquarePlus, Send } from 'lucide-react';
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
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {resolvedCount > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={p.showResolved}
              onChange={(e) => p.onShowResolved(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
            />
            הצג גם הערות שטופלו ({resolvedCount})
          </label>
        )}

        {empty && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-400">
            <MessageSquarePlus className="h-8 w-8" />
            {p.canPin ? 'אין הערות פתוחות. לחצו על התמונה כדי להצמיד הערה, או כתבו הערה כללית למטה.' : 'אין הערות פתוחות על הגרסה הזו.'}
          </div>
        )}

        {pinned.length > 0 && (
          <Group title="על התמונה">
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
          <Group title="הערות כלליות">
            {general.map((c) => (
              <CommentRow key={c.id} comment={c} onToggle={() => p.onToggleResolved(c.id)} />
            ))}
          </Group>
        )}

        {p.olderCount > 0 && <p className="text-center text-[11px] text-slate-400">עוד {p.olderCount} הערות בגרסאות קודמות</p>}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="הערה כללית…"
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            data-testid="general-comment-input"
          />
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
            aria-label="שליחת הערה"
          >
            <Send className="h-4 w-4 -scale-x-100" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CommentRow({
  comment,
  number,
  active,
  onClick,
  onToggle,
}: {
  comment: Comment;
  number?: number;
  active?: boolean;
  onClick?: () => void;
  onToggle: () => void;
}) {
  const { userById } = useLookups();
  const author = userById.get(comment.authorId);
  return (
    <div
      data-comment={comment.id}
      data-testid="comment"
      onClick={onClick}
      className={`group rounded-lg border p-3 transition ${onClick ? 'cursor-pointer' : ''} ${
        active ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 bg-white hover:border-slate-300'
      } ${comment.resolved ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        {number !== undefined ? (
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
              active ? 'bg-brand-600' : comment.resolved ? 'bg-slate-400' : 'bg-rose-500'
            }`}
          >
            {number}
          </span>
        ) : (
          author && <Avatar user={author} size="sm" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            {number !== undefined && author && <Avatar user={author} size="xs" />}
            <span className="font-semibold text-slate-800">{author?.name}</span>
            <span className="text-slate-400">· {timeAgo(comment.createdAt)}</span>
          </div>
          <p className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 ${comment.resolved ? 'line-through decoration-slate-300' : ''}`}>
            {comment.text}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
                comment.resolved ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
              data-testid="resolve-btn"
            >
              <Check className="h-3.5 w-3.5" />
              {comment.resolved ? 'טופל' : 'סמן כטופל'}
            </button>
            {number !== undefined && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3" />
                מוצמד לתמונה
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
