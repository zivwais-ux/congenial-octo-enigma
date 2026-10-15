import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/StoreProvider';
import { NAV } from './nav';

/** סרגל ניווט תחתון למובייל */
export function MobileNav() {
  const { currentUser } = useStore();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex">
        {NAV.filter((n) => n.roles.includes(currentUser.role)).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-brand-600' : 'text-slate-500'}`
            }
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
