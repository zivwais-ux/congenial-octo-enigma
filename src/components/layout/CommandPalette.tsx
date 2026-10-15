import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, CornerDownLeft, LayoutGrid, Plus, Search, Sparkles, UserRound } from 'lucide-react';
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
        ? [{ id: 'a-upload', group: 'פעולות', label: 'העלאת עבודה חדשה', icon: <Plus className="h-4 w-4" />, run: go('/upload') }]
        : []),
      { id: 'a-home', group: 'פעולות', label: currentUser.role === 'approver' ? 'לאישור שלי' : 'העבודות שלי', icon: <LayoutGrid className="h-4 w-4" />, run: go('/') },
      { id: 'a-archive', group: 'פעולות', label: 'ארכיון עבודות מאושרות', icon: <Archive className="h-4 w-4" />, run: go('/archive') },
      { id: 'a-guide', group: 'פעולות', label: 'מדריך ההדגמה', icon: <Sparkles className="h-4 w-4" />, run: () => setGuideOpen(true) },
      ...state.users
        .filter((u) => u.id !== currentUser.id)
        .map((u) => ({
          id: `u-${u.id}`,
          group: 'צפייה בתור',
          label: u.name,
          hint: u.title,
          icon: <UserRound className="h-4 w-4" />,
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
        icon: <FileThumb version={i.versions[i.versions.length - 1]} className="checker h-7 w-9 rounded ring-1 ring-zinc-200" />,
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
    <div className="anim-fade fixed inset-0 z-[75] flex items-start justify-center bg-zinc-950/40 p-3 pt-[12vh] backdrop-blur-[2px]" onMouseDown={close}>
      <div
        className="anim-pop w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-pop"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="חיפוש מהיר"
      >
        <div className="flex items-center gap-3 border-b border-zinc-100 px-4">
          <Search className="h-5 w-5 text-zinc-400" />
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
            className="h-14 flex-1 bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid="palette-input"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={listRef} className="scroll-thin max-h-[55vh] overflow-y-auto p-2">
          {entries.length === 0 && <div className="px-3 py-10 text-center text-sm text-zinc-500">לא נמצא דבר עבור "{q}"</div>}
          {entries.map((e, i) => {
            const header = e.group !== lastGroup ? e.group : null;
            lastGroup = e.group;
            return (
              <div key={e.id}>
                {header && <div className="px-3 pb-1 pt-3 text-[11px] font-semibold text-zinc-400">{header}</div>}
                <button
                  data-idx={i}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => run(e)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition ${i === index ? 'bg-zinc-100' : ''}`}
                >
                  <span className="flex h-7 w-9 shrink-0 items-center justify-center text-zinc-500">{e.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900">{e.label}</span>
                    {e.hint && <span className="block truncate text-xs text-zinc-500">{e.hint}</span>}
                  </span>
                  {e.right}
                  {i === index && <CornerDownLeft className="h-4 w-4 shrink-0 text-zinc-400" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2 text-[11px] text-zinc-500">
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
