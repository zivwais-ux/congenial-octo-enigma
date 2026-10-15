import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../../store/StoreProvider';
import { UserSwitcher } from './UserSwitcher';
import { NotificationBell } from './NotificationBell';
import { NAV } from './nav';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold text-slate-900">גדות</span>
        <span className="block text-[11px] text-slate-500">אישור עבודות</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { currentUser } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ms-4 hidden items-center gap-1 md:flex">
          {NAV.filter((n) => n.roles.includes(currentUser.role)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 lg:inline">
            גרסת דמו
          </span>
          <NotificationBell />
          <UserSwitcher />
        </div>
      </div>
    </header>
  );
}
