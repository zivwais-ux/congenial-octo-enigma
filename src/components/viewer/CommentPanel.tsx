import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronDown, CornerDownLeft, History, MoreHorizontal, Trash2 } from 'lucide-react';
import type { Comment, User, Version } from '../../types';
import { useLookups, useStore } from '../../store/StoreProvider';
import { useClickOutside } from '../../hooks/useClickOutside';
import { timeAgo } from '../../lib/dates';
import { Avatar } from '../ui/Avatar';
import type { NumberedPin } from './PreviewPane';

interface Props {
  version: Version;
  designer: User;
  pinned: NumberedPin[];
  general: Comment[];
  /** כל התגובות של הגרסה; מקובצות כאן לפי parentId */
  replies: Comment[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onToggleResolved: (id: string) => void;
  onDelete: (id: string) => void;
  onAddGeneral: (text: string) => void;
  onReply: (parentId: string, text: string, resolve: boolean) => void;
  showResolved: boolean;
  onShowResolved: (v: boolean) => void;
  olderCount: number;
  canPin: boolean;
  /** הערות הגרסה הקודמת, לבדיקה שהתיקונים בוצעו */
  previous?: { versionNumber: number; comments: { comment: Comment; number?: number }[] };
}

/** שרשור ההערות של הגרסה: הערת המעצב, הערות על העבודה עם תגובות, הערות כלליות, ותיבת כתיבה */
export function CommentPanel(p: Props) {
  const { currentUser } = useStore();
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // גלילה להערה שנבחרה מתוך הסימון על העבודה
  useEffect(() => {
    if (!p.activeId) return;
    listRef.current?.querySelector(`[data-comment="${p.activeId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [p.activeId]);

  const repliesOf = (id: string) => p.replies.filter((r) => r.parentId === id);
  const resolvedCount = [...p.pinned.map((x) => x.comment), ...p.general].filter((c) => c.resolved).length;
  const pinned = p.pinned.filter((x) => p.showResolved || !x.comment.resolved || x.comment.id === p.activeId);
  const general = p.general.filter((c) => p.showResolved || !c.resolved);
  const empty = pinned.length === 0 && general.length === 0;

  const submit = () => {
    if (!text.trim()) return;
    p.onAddGeneral(text.trim());
    setText('');
  };

  const thread = (comment: Comment, number?: number) => (
    <Thread
      key={comment.id}
      comment={comment}
      number={number}
      replies={repliesOf(comment.id)}
      active={comment.id === p.activeId}
      onClick={number !== undefined ? () => p.onSelect(comment.id === p.activeId ? null : comment.id) : undefined}
      onToggle={() => p.onToggleResolved(comment.id)}
      onDelete={p.onDelete}
      replying={replyingTo === comment.id}
      onStartReply={() => setReplyingTo(comment.id)}
      onCancelReply={() => setReplyingTo(null)}
      onReply={(t, resolve) => {
        p.onReply(comment.id, t, resolve);
        setReplyingTo(null);
      }}
    />
  );

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

        {p.previous && p.previous.comments.length > 0 && <PreviousVersion {...p.previous} activeId={p.activeId} onSelect={p.onSelect} />}

        {empty ? (
          <div className="px-6 py-10 text-center">
            <div className="text-base font-medium text-ink">{resolvedCount ? 'כל ההערות טופלו' : 'אין עדיין הערות'}</div>
            <p className="mx-auto mt-1 max-w-[15rem] text-sm text-stone-500">
              {p.canPin ? 'לוחצים על נקודה בעבודה כדי להשאיר הערה מדויקת, או כותבים הערה כללית למטה.' : 'אפשר לכתוב הערה כללית למטה.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {pinned.map(({ comment, number }) => thread(comment, number))}
            {general.map((c) => thread(c))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 px-4 py-4 text-xs text-stone-400">
          {resolvedCount > 0 && (
            <button onClick={() => p.onShowResolved(!p.showResolved)} className="transition hover:text-ink">
              {p.showResolved ? 'הסתרת הערות שטופלו' : `הצגת ${resolvedCount === 1 ? 'הערה אחת שטופלה' : `${resolvedCount} הערות שטופלו`}`}
            </button>
          )}
          {p.olderCount > 0 && !p.previous && <span>{p.olderCount === 1 ? 'עוד הערה אחת' : `עוד ${p.olderCount} הערות`} בגרסאות קודמות</span>}
        </div>
      </div>

      <div className="border-t border-stone-200/80 bg-white p-3">
        <div className="flex items-end gap-2.5">
          <span className="pb-1.5">
            <Avatar user={currentUser} size="sm" />
          </span>
          <Composer value={text} onChange={setText} onSubmit={submit} placeholder="כתיבת הערה…" testId="general-comment-input" />
        </div>
      </div>
    </div>
  );
}

/** "מגרסה 1 · 2 טופלו, 1 פתוחה": מה קרה להערות של הסבב הקודם */
function PreviousVersion({
  versionNumber,
  comments,
  activeId,
  onSelect,
}: {
  versionNumber: number;
  comments: { comment: Comment; number?: number }[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { userById } = useLookups();
  const fixed = comments.filter((c) => c.comment.resolved).length;
  const openN = comments.length - fixed;
  const [expanded, setExpanded] = useState(openN > 0);
  return (
    <div className="border-b border-stone-100" data-testid="previous-version">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm transition hover:bg-stone-50" aria-expanded={expanded}>
        <History className="h-3.5 w-3.5 text-stone-400" />
        <span className="font-medium text-ink">מגרסה {versionNumber}</span>
        <span className="num text-xs text-stone-500">
          {fixed > 0 && <span className="text-emerald-700">{fixed === 1 ? 'אחת טופלה' : `${fixed} טופלו`}</span>}
          {fixed > 0 && openN > 0 && ' · '}
          {openN > 0 && <span className="text-signal-700">{openN === 1 ? 'אחת פתוחה' : `${openN} פתוחות`}</span>}
        </span>
        <ChevronDown className={`ms-auto h-4 w-4 text-stone-400 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <ul className="space-y-1 px-3 pb-3">
          {comments.map(({ comment, number }) => {
            const author = userById.get(comment.authorId);
            const active = comment.id === activeId;
            const body = (
              <>
                <span
                  className={`num mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed text-2xs font-semibold ${
                    comment.resolved ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-signal-400 bg-signal-50 text-signal-700'
                  }`}
                >
                  {comment.resolved ? <Check className="h-3 w-3" strokeWidth={3} /> : (number ?? '·')}
                </span>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className={`block text-sm ${comment.resolved ? 'text-stone-500' : 'text-ink'}`}>{comment.text}</span>
                  <span className="block text-xs text-stone-400">
                    {author?.name} · {comment.resolved ? 'טופל' : 'עדיין פתוח'}
                  </span>
                </span>
              </>
            );
            return (
              <li key={comment.id} data-comment={comment.id}>
                {number !== undefined ? (
                  <button
                    onClick={() => onSelect(active ? null : comment.id)}
                    className={`flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-start transition ${active ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex items-start gap-2.5 px-2 py-1.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** תיבת כתיבה שגדלה עם הטקסט; Enter שולח, Shift+Enter שורה חדשה */
function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  testId,
  autoFocus,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  testId?: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <div className="flex min-w-0 flex-1 items-end rounded-lg border border-stone-300/80 bg-white shadow-xs transition focus-within:border-ink focus-within:ring-[3px] focus-within:ring-ink/[0.07]">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={1}
        placeholder={placeholder}
        className={`block max-h-[140px] w-full resize-none bg-transparent px-3 text-ink placeholder:text-stone-400 focus:outline-none focus-visible:ring-0 ${
          compact ? 'min-h-[34px] py-1.5 text-sm leading-[22px]' : 'min-h-[38px] py-2 text-base leading-[22px]'
        }`}
        data-testid={testId}
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className={`m-1 flex shrink-0 items-center justify-center rounded-md bg-ink text-white transition hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 ${compact ? 'h-6 w-6' : 'h-7 w-7'}`}
        aria-label="שליחה"
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}

function Thread({
  comment,
  number,
  replies,
  active,
  onClick,
  onToggle,
  onDelete,
  replying,
  onStartReply,
  onCancelReply,
  onReply,
}: {
  comment: Comment;
  number?: number;
  replies: Comment[];
  active?: boolean;
  onClick?: () => void;
  onToggle: () => void;
  onDelete: (id: string) => void;
  replying: boolean;
  onStartReply: () => void;
  onCancelReply: () => void;
  onReply: (text: string, resolve: boolean) => void;
}) {
  const { userById } = useLookups();
  const { currentUser } = useStore();
  const author = userById.get(comment.authorId);
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  // בהערה שטופלה, התגובות מקופלות כדי לשמור על רשימה נקייה
  const showReplies = !comment.resolved || expanded;

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
        <span className="ms-auto flex items-center gap-0.5">
          {number !== undefined && (
            <span
              className={`num me-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold text-white ${comment.resolved ? 'bg-stone-400' : 'bg-signal-500'}`}
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
          {comment.authorId === currentUser.id && <MoreMenu onDelete={() => onDelete(comment.id)} />}
        </span>
      </div>
      <p className={`mt-1 whitespace-pre-wrap ps-8 text-base leading-6 ${comment.resolved ? 'text-stone-400 line-through decoration-stone-300' : 'text-stone-800'}`}>{comment.text}</p>

      {/* תגובות */}
      {replies.length > 0 && !showReplies && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className="mt-2 ps-8 text-xs text-stone-500 transition hover:text-ink"
        >
          {replies.length === 1 ? 'תגובה אחת' : `${replies.length} תגובות`}
        </button>
      )}
      {replies.length > 0 && showReplies && (
        <div className="ms-8 mt-2.5 space-y-2.5 border-s-2 border-stone-200 ps-3" onClick={(e) => e.stopPropagation()} data-testid="replies">
          {replies.map((r) => {
            const ra = userById.get(r.authorId);
            return (
              <div key={r.id} className="group/reply" data-testid="reply">
                <div className="flex items-center gap-1.5 text-sm">
                  {ra && <Avatar user={ra} size="xs" />}
                  <span className="font-medium text-ink">{ra?.name}</span>
                  <span className="text-stone-400">{timeAgo(r.createdAt)}</span>
                  {r.authorId === currentUser.id && (
                    <span className="ms-auto opacity-0 transition group-hover/reply:opacity-100 [@media(hover:none)]:opacity-100">
                      <MoreMenu onDelete={() => onDelete(r.id)} />
                    </span>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap ps-[26px] text-sm leading-6 text-stone-700">{r.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* כתיבת תגובה */}
      {replying ? (
        <div className="ms-8 mt-2.5" onClick={(e) => e.stopPropagation()}>
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => {
              if (!draft.trim()) return;
              onReply(draft.trim(), false);
              setDraft('');
            }}
            placeholder={`תגובה ל${author?.name ?? 'הערה'}…`}
            testId="reply-input"
            autoFocus
            compact
          />
          <div className="mt-1.5 flex items-center gap-1">
            {!comment.resolved && (
              <button
                disabled={!draft.trim()}
                onClick={() => {
                  onReply(draft.trim(), true);
                  setDraft('');
                }}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40"
                data-testid="reply-resolve"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
                שליחה וסימון כטופל
              </button>
            )}
            <button onClick={onCancelReply} className="h-7 rounded-md px-2 text-xs text-stone-500 transition hover:bg-stone-100 hover:text-ink">
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartReply();
          }}
          className="mt-2 flex items-center gap-1 ps-8 text-xs text-stone-500 transition hover:text-ink"
          data-testid="reply-btn"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
          תגובה
        </button>
      )}
    </div>
  );
}

/** תפריט ⋯ קטן עם מחיקה (רק לכותב ההערה) */
function MoreMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref as React.RefObject<HTMLElement>, open, close);
  return (
    <span ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 items-center justify-center rounded-md text-stone-300 transition hover:bg-stone-100 hover:text-ink"
        aria-label="פעולות נוספות"
        data-testid="comment-menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <span className="anim-pop absolute end-0 top-full z-20 mt-1 block w-32 overflow-hidden rounded-md border border-stone-200 bg-white py-1 shadow-pop">
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm text-red-700 transition hover:bg-red-50"
            data-testid="comment-delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
            מחיקה
          </button>
        </span>
      )}
    </span>
  );
}
