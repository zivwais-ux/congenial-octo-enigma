import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check } from 'lucide-react';
import type { Comment, User, Version } from '../../types';
import { useLookups, useStore } from '../../store/StoreProvider';
import { timeAgo } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import type { NumberedPin } from './PreviewPane';

interface Props {
  version: Version;
  designer: User;
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

/** שרשור ההערות של הגרסה: הערת המעצב, הערות על העבודה, הערות כלליות, ותיבת כתיבה */
export function CommentPanel(p: Props) {
  const { currentUser } = useStore();
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // גלילה להערה שנבחרה מתוך הסימון על העבודה
  useEffect(() => {
    if (!p.activeId) return;
    listRef.current?.querySelector(`[data-comment="${p.activeId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [p.activeId]);

  // התיבה גדלה עם הטקסט
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

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
      <div ref={listRef} className="scroll-thin flex-1 overflow-y-auto">
        {p.version.note && (
          <div className="border-b border-stone-100 bg-stone-50/70 px-4 py-3.5">
            <div className="flex items-center gap-2 text-sm">
              <Avatar user={p.designer} size="sm" />
              <span className="font-medium text-ink">{p.designer.name}</span>
              <span className="text-stone-400">הערה לגרסה {p.version.number}</span>
            </div>
            <p className="mt-1.5 ps-8 text-base leading-6 text-stone-700">{p.version.note}</p>
          </div>
        )}

        {empty ? (
          <div className="px-6 py-12 text-center">
            <div className="text-base font-medium text-ink">{resolvedCount ? 'כל ההערות טופלו' : 'אין עדיין הערות'}</div>
            <p className="mx-auto mt-1 max-w-[15rem] text-sm text-stone-500">
              {p.canPin ? 'לוחצים על נקודה בעבודה כדי להשאיר הערה מדויקת, או כותבים הערה כללית למטה.' : 'אפשר לכתוב הערה כללית למטה.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {pinned.map(({ comment, number }) => (
              <Thread
                key={comment.id}
                comment={comment}
                number={number}
                active={comment.id === p.activeId}
                onClick={() => p.onSelect(comment.id === p.activeId ? null : comment.id)}
                onToggle={() => p.onToggleResolved(comment.id)}
              />
            ))}
            {general.map((c) => (
              <Thread key={c.id} comment={c} onToggle={() => p.onToggleResolved(c.id)} />
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 px-4 py-4 text-xs text-stone-400">
          {resolvedCount > 0 && (
            <button onClick={() => p.onShowResolved(!p.showResolved)} className="transition hover:text-ink">
              {p.showResolved ? 'הסתרת הערות שטופלו' : `הצגת ${resolvedCount === 1 ? 'הערה אחת שטופלה' : `${resolvedCount} הערות שטופלו`}`}
            </button>
          )}
          {p.olderCount > 0 && <span>{p.olderCount === 1 ? 'עוד הערה אחת' : `עוד ${p.olderCount} הערות`} בגרסאות קודמות</span>}
        </div>
      </div>

      <div className="border-t border-stone-200/80 bg-white p-3">
        <div className="flex items-end gap-2.5">
          <span className="pb-1.5">
            <Avatar user={currentUser} size="sm" />
          </span>
          <div className="flex min-w-0 flex-1 items-end rounded-lg border border-stone-300/80 bg-white shadow-xs transition focus-within:border-ink focus-within:ring-[3px] focus-within:ring-ink/[0.07]">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="כתיבת הערה…"
              className="block max-h-[140px] min-h-[38px] w-full resize-none bg-transparent px-3 py-2 text-base leading-[22px] text-ink placeholder:text-stone-400 focus:outline-none focus-visible:ring-0"
              data-testid="general-comment-input"
            />
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="m-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink text-white transition hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400"
              aria-label="שליחה"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Thread({ comment, number, active, onClick, onToggle }: { comment: Comment; number?: number; active?: boolean; onClick?: () => void; onToggle: () => void }) {
  const { userById } = useLookups();
  const author = userById.get(comment.authorId);
  return (
    <div
      data-comment={comment.id}
      data-testid="comment"
      onClick={onClick}
      className={`group relative px-4 py-3.5 transition-colors ${onClick ? 'cursor-pointer' : ''} ${active ? 'bg-signal-50/60' : onClick ? 'hover:bg-stone-50/80' : ''}`}
    >
      {active && <span className="absolute inset-y-0 start-0 w-0.5 bg-signal-500" />}
      <div className="flex items-center gap-2 text-sm">
        {author && <Avatar user={author} size="sm" />}
        <span className="font-medium text-ink">{author?.name}</span>
        <span className="text-stone-400">{timeAgo(comment.createdAt)}</span>
        <span className="ms-auto flex items-center gap-1">
          {number !== undefined && (
            <span
              className={`num flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold text-white ${comment.resolved ? 'bg-stone-400' : 'bg-signal-500'}`}
              title="מספר הסימון על העבודה"
            >
              {number}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
              comment.resolved ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone-300 hover:bg-stone-100 hover:text-ink'
            }`}
            title={comment.resolved ? 'סומן כטופל. לחיצה לביטול' : 'סימון כטופל'}
            aria-label={comment.resolved ? 'ביטול סימון טופל' : 'סימון כטופל'}
            data-testid="resolve-btn"
          >
            <Check className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </span>
      </div>
      <p className={`mt-1 whitespace-pre-wrap ps-8 text-base leading-6 ${comment.resolved ? 'text-stone-400 line-through decoration-stone-300' : 'text-stone-800'}`}>{comment.text}</p>
    </div>
  );
}
