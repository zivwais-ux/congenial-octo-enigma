import { NavLink } from 'react-router-dom';
import { Archive, LayoutGrid, Plus } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';

/** ניווט תחתון במובייל */
export function MobileNav() {
  const { state, currentUser } = useStore();
  const isApprover = currentUser.role === 'approver';
  const count = state.items.filter((i) =>
    isApprover ? i.approverId === currentUser.id && i.status === 'pending' : i.designerId === currentUser.id && i.status === 'changes',
  ).length;
  const cls = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-medium transition ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="ניווט">
      <div className="flex items-stretch">
        <NavLink to="/" end className={cls}>
          <span className="relative">
            <LayoutGrid className="h-[22px] w-[22px]" />
            {count > 0 && (
              <span className="absolute -end-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">{count}</span>
            )}
          </span>
          {isApprover ? 'לאישור' : 'העבודות שלי'}
        </NavLink>
        {!isApprover && (
          <NavLink to="/upload" className={cls}>
            {({ isActive }) => (
              <>
                <span className={`-mt-1 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${isActive ? 'bg-brand-600 text-white' : 'bg-zinc-900 text-white'}`}>
                  <Plus className="h-5 w-5" />
                </span>
                העלאה
              </>
            )}
          </NavLink>
        )}
        <NavLink to="/archive" className={cls}>
          <Archive className="h-[22px] w-[22px]" />
          ארכיון
        </NavLink>
      </div>
    </nav>
  );
}
