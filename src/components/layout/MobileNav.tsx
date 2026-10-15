import { NavLink } from 'react-router-dom';
import { Archive, Inbox, Plus } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';

/** ניווט תחתון במובייל */
export function MobileNav() {
  const { state, currentUser } = useStore();
  const isApprover = currentUser.role === 'approver';
  const count = state.items.filter((i) =>
    isApprover ? i.approverId === currentUser.id && i.status === 'pending' : i.designerId === currentUser.id && i.status === 'changes',
  ).length;
  const cls = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-2xs font-medium transition-colors ${isActive ? 'text-ink after:absolute after:top-0 after:h-0.5 after:w-8 after:rounded-full after:bg-signal-500' : 'text-stone-400'}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="ניווט">
      <div className="flex">
        <NavLink to="/" end className={cls}>
          <span className="relative">
            <Inbox className="h-5 w-5" strokeWidth={1.75} />
            {count > 0 && (
              <span className="num absolute -end-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal-500 px-1 text-[9px] font-semibold text-white">{count}</span>
            )}
          </span>
          {isApprover ? 'תור האישורים' : 'העבודות שלי'}
        </NavLink>
        {!isApprover && (
          <NavLink to="/upload" className={cls}>
            <Plus className="h-5 w-5" strokeWidth={1.75} />
            העלאה
          </NavLink>
        )}
        <NavLink to="/archive" className={cls}>
          <Archive className="h-5 w-5" strokeWidth={1.75} />
          ארכיון
        </NavLink>
      </div>
    </nav>
  );
}
