import { Link, matchPath, useLocation } from 'react-router-dom';
import { ListChecks, Search } from 'lucide-react';
import { useLookups, useStore } from '../../store/StoreProvider';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { UserSwitcher } from './UserSwitcher';
import { useUI } from './UIContext';

function useCrumbs(): { label: string; to?: string; color?: string }[] {
  const { pathname } = useLocation();
  const { state, currentUser } = useStore();
  const { projectById } = useLookups();
  const item = matchPath('/item/:id', pathname);
  if (item) {
    const it = state.items.find((i) => i.id === item.params.id);
    const p = it && projectById.get(it.projectId);
    return [{ label: p?.name ?? 'עבודה', to: p ? `/?project=${p.id}` : '/', color: p?.color }, { label: it?.title ?? '' }];
  }
  if (pathname === '/upload') return [{ label: 'העלאת עבודה' }];
  if (pathname === '/archive') return [{ label: 'ארכיון' }];
  return [{ label: currentUser.role === 'approver' ? 'תור האישורים' : 'העבודות שלי' }];
}

export function TopBar() {
  const crumbs = useCrumbs();
  const { setPaletteOpen, setGuideOpen } = useUI();
  const iconBtn = 'flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-ink';
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-[52px] items-center gap-3 px-4 lg:px-6">
        <div className="lg:hidden">
          <Logo />
        </div>
        <nav className="hidden min-w-0 items-center gap-2 text-sm lg:flex" aria-label="מיקום">
          {crumbs.map((c, i) => (
            <span key={i} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span className="text-stone-300">/</span>}
              {c.to ? (
                <Link to={c.to} className="flex items-center gap-1.5 truncate text-stone-500 transition hover:text-ink">
                  {c.color && <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: c.color }} />}
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-ink">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-0.5">
          <span className="me-3 hidden h-6 items-center gap-1.5 rounded-full bg-signal-50 px-2.5 text-xs text-signal-700 ring-1 ring-inset ring-signal-100 xl:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-500" />
            סקיצה להדגמה · הנתונים נשמרים בדפדפן בלבד
          </span>
          <button onClick={() => setGuideOpen(true)} className={`${iconBtn} lg:hidden`} aria-label="תסריט ההדגמה">
            <ListChecks className="h-[18px] w-[18px] text-violet-600" strokeWidth={1.9} />
          </button>
          <button onClick={() => setPaletteOpen(true)} className={`${iconBtn} lg:hidden`} aria-label="חיפוש">
            <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
          <NotificationBell />
          <div className="ms-1.5 lg:hidden">
            <UserSwitcher variant="compact" />
          </div>
        </div>
      </div>
    </header>
  );
}
