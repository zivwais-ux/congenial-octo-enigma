import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { Archive, LayoutGrid, Plus, Search, Sparkles } from 'lucide-react';
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

  const linkCls = (active: boolean) =>
    `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
      active ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200' : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
    }`;

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-zinc-200 bg-zinc-100/70 backdrop-blur lg:flex">
      <div className="px-4 pb-3 pt-4">
        <Logo />
      </div>

      <div className="space-y-2 px-3">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-start text-sm text-zinc-400 shadow-sm shadow-zinc-900/[0.02] transition hover:border-zinc-300 hover:text-zinc-500"
          data-testid="open-palette"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1">חיפוש עבודה…</span>
          <Kbd>⌘K</Kbd>
        </button>
        {!isApprover && (
          <NavLink
            to="/upload"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            העלאת עבודה
          </NavLink>
        )}
      </div>

      <nav className="mt-4 space-y-0.5 px-3" aria-label="ניווט ראשי">
        <NavLink to="/" end className={() => linkCls(pathname === '/' && !activeProject)}>
          <LayoutGrid className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600" />
          <span className="flex-1">{isApprover ? 'לאישור שלי' : 'העבודות שלי'}</span>
          {myCount > 0 && (
            <span className={`rounded-full px-1.5 text-[11px] font-bold ${isApprover ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'}`}>{myCount}</span>
          )}
        </NavLink>
        <NavLink to="/archive" className={({ isActive }) => linkCls(isActive)}>
          <Archive className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600" />
          <span className="flex-1">ארכיון</span>
          <span className="text-[11px] font-medium text-zinc-400">{archiveCount}</span>
        </NavLink>
      </nav>

      <div className="mt-6 px-3">
        <div className="px-2.5 pb-1.5 text-[11px] font-semibold text-zinc-400">פרויקטים</div>
        <div className="space-y-0.5">
          {state.projects.map((p) => {
            const open = state.items.filter((i) => i.projectId === p.id && (i.status === 'pending' || i.status === 'changes')).length;
            return (
              <NavLink key={p.id} to={`/?project=${p.id}`} className={() => linkCls(activeProject === p.id)}>
                <span className="flex h-4 w-4 items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: p.color }} />
                </span>
                <span className="flex-1 truncate">{p.name}</span>
                {open > 0 && <span className="text-[11px] font-medium text-zinc-400">{open}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="mt-auto space-y-3 p-3">
        <button
          onClick={() => setGuideOpen(true)}
          className="w-full rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-3 text-start transition hover:border-brand-300"
          data-testid="open-guide"
        >
          <span className="flex items-center gap-2 text-[13px] font-semibold text-brand-800">
            <Sparkles className="h-4 w-4" />
            מדריך ההדגמה
            <span className="ms-auto text-[11px] font-medium text-brand-600">
              {done}/{steps.length}
            </span>
          </span>
          <span className="mt-2 flex gap-1">
            {steps.map((s) => (
              <span key={s.key} className={`h-1 flex-1 rounded-full ${s.done ? 'bg-brand-500' : 'bg-brand-100'}`} />
            ))}
          </span>
        </button>
        <UserSwitcher />
      </div>
    </aside>
  );
}
