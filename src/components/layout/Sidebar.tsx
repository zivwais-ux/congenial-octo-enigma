import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { Archive, Inbox, ListChecks, Plus, Search } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';
import { tourSteps } from '../../lib/tour';
import { Kbd } from '../ui/Kbd';
import { Logo } from './Logo';
import { UserSwitcher } from './UserSwitcher';
import { useUI } from './UIContext';

export function Sidebar() {
  const { state, currentUser } = useStore();
  const { setPaletteOpen, setGuideOpen } = useUI();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const activeProject = pathname === '/' ? params.get('project') : null;

  const isApprover = currentUser.role === 'approver';
  const myCount = state.items.filter((i) =>
    isApprover ? i.approverId === currentUser.id && i.status === 'pending' : i.designerId === currentUser.id && i.status === 'changes',
  ).length;
  const archiveCount = state.items.filter((i) => i.status === 'approved').length;
  const steps = tourSteps(state);
  const done = steps.filter((s) => s.done).length;

  const item = (active: boolean) =>
    `flex h-8 items-center gap-2.5 rounded-md px-2 text-sm transition-colors ${active ? 'bg-stone-100 font-medium text-ink' : 'text-stone-600 hover:bg-stone-100/70 hover:text-ink'}`;

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col border-e border-stone-200/80 bg-white lg:flex">
      <div className="flex h-[52px] items-center px-4">
        <Logo />
      </div>

      <div className="space-y-1 px-3 pt-1">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex h-8 w-full items-center gap-2 rounded-md border border-stone-200 bg-stone-50/60 px-2 text-start text-sm text-stone-400 transition hover:border-stone-300 hover:text-stone-500"
          data-testid="open-palette"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1">חיפוש</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <nav className="mt-4 space-y-px px-3" aria-label="ניווט ראשי">
        <NavLink to="/" end className={() => item(pathname === '/' && !activeProject)}>
          <Inbox className="h-4 w-4 text-stone-400" strokeWidth={1.75} />
          <span className="flex-1">{isApprover ? 'תור האישורים' : 'העבודות שלי'}</span>
          {myCount > 0 && <span className={`num text-xs font-medium ${isApprover ? 'text-ink' : 'text-amber-700'}`}>{myCount}</span>}
        </NavLink>
        {!isApprover && (
          <NavLink to="/upload" className={({ isActive }) => item(isActive)}>
            <Plus className="h-4 w-4 text-stone-400" strokeWidth={1.75} />
            <span className="flex-1">העלאת עבודה</span>
          </NavLink>
        )}
        <NavLink to="/archive" className={({ isActive }) => item(isActive)}>
          <Archive className="h-4 w-4 text-stone-400" strokeWidth={1.75} />
          <span className="flex-1">ארכיון</span>
          <span className="num text-xs text-stone-400">{archiveCount}</span>
        </NavLink>
      </nav>

      <div className="mt-6 px-3">
        <div className="mb-1 px-2 text-xs font-medium text-stone-400">פרויקטים</div>
        <div className="space-y-px">
          {state.projects.map((p) => {
            const open = state.items.filter((i) => i.projectId === p.id && (i.status === 'pending' || i.status === 'changes')).length;
            return (
              <NavLink key={p.id} to={`/?project=${p.id}`} className={() => item(activeProject === p.id)}>
                <span className="flex w-4 justify-center">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
                </span>
                <span className="flex-1 truncate">{p.name}</span>
                {open > 0 && <span className="num text-xs text-stone-400">{open}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="mt-auto space-y-2 border-t border-stone-200/80 p-3">
        <button onClick={() => setGuideOpen(true)} className={`${item(false)} w-full`} data-testid="open-guide">
          <ListChecks className="h-4 w-4 text-stone-400" strokeWidth={1.75} />
          <span className="flex-1 text-start">תסריט ההדגמה</span>
          <span className="num text-xs text-stone-400">
            {done}/{steps.length}
          </span>
        </button>
        <UserSwitcher />
      </div>
    </aside>
  );
}
