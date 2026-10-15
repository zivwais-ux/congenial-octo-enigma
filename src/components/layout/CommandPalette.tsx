import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, CornerDownLeft, Inbox, ListChecks, Plus, Search, UserRound } from 'lucide-react';
import { useLookups, useStore } from '../../store/StoreProvider';
import { useSwitchUser } from '../../hooks/useSwitchUser';
import { FileThumb } from '../ui/FileThumb';
import { StatusBadge } from '../ui/StatusBadge';
import { Kbd } from '../ui/Kbd';
import { useUI } from './UIContext';

interface Entry {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  right?: ReactNode;
  run: () => void;
}

/** חיפוש מהיר (⌘K): קפיצה לכל עבודה, ופעולות נפוצות */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, setGuideOpen } = useUI();
  const { state, currentUser } = useStore();
  const { userById, projectById } = useLookups();
  const switchUser = useSwitchUser();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setPaletteOpen(false);
    setQ('');
    setIndex(0);
  };

  const entries = useMemo<Entry[]>(() => {
    const needle = q.trim();
    const match = (s: string) => !needle || s.includes(needle);
    const go = (path: string) => () => navigate(path);

    const actions: Entry[] = ([
      ...(currentUser.role === 'designer'
        ? [{ id: 'a-upload', group: 'פעולות', label: 'העלאת עבודה חדשה', icon: <Plus className="h-4 w-4" strokeWidth={1.75} />, run: go('/upload') }]
        : []),
      { id: 'a-home', group: 'פעולות', label: currentUser.role === 'approver' ? 'תור האישורים' : 'העבודות שלי', icon: <Inbox className="h-4 w-4" strokeWidth={1.75} />, run: go('/') },
      { id: 'a-archive', group: 'פעולות', label: 'ארכיון עבודות מאושרות', icon: <Archive className="h-4 w-4" strokeWidth={1.75} />, run: go('/archive') },
      { id: 'a-guide', group: 'פעולות', label: 'תסריט ההדגמה', icon: <ListChecks className="h-4 w-4" strokeWidth={1.75} />, run: () => setGuideOpen(true) },
      ...state.users
        .filter((u) => u.id !== currentUser.id)
        .map((u) => ({
          id: `u-${u.id}`,
          group: 'צפייה בתור',
          label: u.name,
          hint: u.title,
          icon: <UserRound className="h-4 w-4" strokeWidth={1.75} />,
          run: () => switchUser(u.id),
        })),
    ] as Entry[]).filter((e) => match(`${e.label} ${e.hint ?? ''}`));

    const items: Entry[] = [...state.items]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((i) => match(`${i.title} ${projectById.get(i.projectId)?.name} ${userById.get(i.designerId)?.name}`))
      .slice(0, needle ? 12 : 6)
      .map((i) => ({
        id: `i-${i.id}`,
        group: needle ? 'עבודות' : 'עבודות אחרונות',
        label: i.title,
        hint: `${projectById.get(i.projectId)?.name} · ${userById.get(i.designerId)?.name}`,
        icon: <FileThumb version={i.versions[i.versions.length - 1]} className="h-7 w-9 rounded border border-stone-200 bg-stone-50" />,
        right: <StatusBadge status={i.status} />,
        run: go(`/item/${i.id}`),
      }));

    return needle ? [...items, ...actions] : [...actions.slice(0, 4), ...items, ...actions.slice(4)];
  }, [q, state.items, state.users, currentUser, navigate, projectById, userById, switchUser, setGuideOpen]);

  useEffect(() => setIndex(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (!paletteOpen) return null;

  const run = (e: Entry) => {
    close();
    e.run();
  };

  let lastGroup = '';
  return (
    <div className="anim-fade fixed inset-0 z-[75] flex items-start justify-center bg-stone-950/25 p-3 pt-[12vh]" onMouseDown={close}>
      <div
        className="anim-pop w-full max-w-[560px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="חיפוש מהיר"
      >
        <div className="flex items-center gap-3 border-b border-stone-200/80 px-4">
          <Search className="h-4 w-4 text-stone-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndex((i) => Math.min(entries.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndex((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter' && entries[index]) {
                run(entries[index]);
              } else if (e.key === 'Escape') {
                close();
              }
            }}
            placeholder="חיפוש עבודה, פרויקט, מעצב או פעולה…"
            className="h-12 flex-1 bg-transparent text-[15px] text-ink placeholder:text-stone-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid="palette-input"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={listRef} className="scroll-thin max-h-[55vh] overflow-y-auto p-2">
          {entries.length === 0 && <div className="px-3 py-10 text-center text-sm text-stone-500">לא נמצא דבר עבור "{q}"</div>}
          {entries.map((e, i) => {
            const header = e.group !== lastGroup ? e.group : null;
            lastGroup = e.group;
            return (
              <div key={e.id}>
                {header && <div className="px-2.5 pb-1 pt-3 text-xs text-stone-400">{header}</div>}
                <button
                  data-idx={i}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => run(e)}
                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-start ${i === index ? 'bg-stone-100' : ''}`}
                >
                  <span className="flex h-7 w-9 shrink-0 items-center justify-center text-stone-500">{e.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{e.label}</span>
                    {e.hint && <span className="block truncate text-xs text-stone-500">{e.hint}</span>}
                  </span>
                  {e.right}
                  {i === index && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-stone-400" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="hidden items-center gap-4 border-t border-stone-200/80 bg-stone-50 px-4 py-2 text-xs text-stone-500 sm:flex">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            ניווט
          </span>
          <span className="flex items-center gap-1">
            <Kbd>Enter</Kbd>
            פתיחה
          </span>
          <span className="ms-auto">
            אפשר לפתוח מכל מקום עם <Kbd>/</Kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
