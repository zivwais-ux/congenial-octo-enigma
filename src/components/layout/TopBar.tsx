import { Link, matchPath, useLocation } from 'react-router-dom';
import { ChevronLeft, Search, Sparkles } from 'lucide-react';
import { useLookups, useStore } from '../../store/StoreProvider';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { UserSwitcher } from './UserSwitcher';
import { useUI } from './UIContext';

function useCrumbs(): { label: string; to?: string }[] {
  const { pathname } = useLocation();
  const { state } = useStore();
  const { projectById } = useLookups();
  const item = matchPath('/item/:id', pathname);
  if (item) {
    const it = state.items.find((i) => i.id === item.params.id);
    const p = it && projectById.get(it.projectId);
    return [{ label: p?.name ?? 'עבודה', to: p ? `/?project=${p.id}` : '/' }, { label: it?.title ?? '' }];
  }
  if (pathname === '/upload') return [{ label: 'העלאת עבודה' }];
  if (pathname === '/archive') return [{ label: 'ארכיון' }];
  return [{ label: 'סקירה' }];
}

export function TopBar() {
  const crumbs = useCrumbs();
  const { setPaletteOpen, setGuideOpen } = useUI();
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <div className="lg:hidden">
          <Logo compact />
        </div>
        <nav className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex" aria-label="מיקום">
          {crumbs.map((c, i) => (
            <span key={i} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronLeft className="h-4 w-4 shrink-0 text-zinc-300" />}
              {c.to ? (
                <Link to={c.to} className="truncate text-zinc-500 transition hover:text-zinc-900">
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-semibold text-zinc-900">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <span className="me-2 hidden rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200 xl:inline-flex">
            גרסת הדגמה · הנתונים נשמרים בדפדפן בלבד
          </span>
          <button
            onClick={() => setGuideOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-600 transition hover:bg-brand-50 lg:hidden"
            aria-label="מדריך ההדגמה"
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 lg:hidden"
            aria-label="חיפוש"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <NotificationBell />
          <div className="ms-1 lg:hidden">
            <UserSwitcher variant="compact" />
          </div>
        </div>
      </div>
    </header>
  );
}
