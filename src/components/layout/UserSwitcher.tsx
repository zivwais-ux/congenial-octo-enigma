import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useToast } from '../ui/Toast';
import { Avatar } from '../ui/Avatar';
import type { Role } from '../../types';

const ROLE_LABEL: Record<Role, string> = { approver: 'מאשרים', designer: 'מעצבים' };

export function UserSwitcher() {
  const { state, update, currentUser, resetDemo } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);
  const toast = useToast();
  const navigate = useNavigate();

  const pendingFor = (userId: string, role: Role) =>
    state.items.filter((i) =>
      role === 'approver' ? i.approverId === userId && i.status === 'pending' : i.designerId === userId && i.status === 'changes',
    ).length;

  const switchTo = (id: string) => {
    update((s) => ({ ...s, currentUserId: id }));
    setOpen(false);
    const u = state.users.find((x) => x.id === id);
    if (u) toast(`עברת למשתמש: ${u.name}`, 'info');
  };

  const onReset = () => {
    if (!confirm('לאפס את הדמו? כל השינויים והקבצים שהועלו יימחקו.')) return;
    resetDemo();
    setOpen(false);
    navigate('/');
    toast('הדמו אופס לנתוני ההתחלה', 'info');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg py-1 pe-1.5 ps-1 text-start hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="user-switcher"
      >
        <Avatar user={currentUser} />
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-semibold text-slate-900">{currentUser.name}</span>
          <span className="block text-[11px] text-slate-500">{currentUser.role === 'approver' ? 'מאשר/ת' : 'מעצב/ת'}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            החלפת משתמש לצורכי הדגמה. במערכת האמיתית כל אחד נכנס עם החשבון שלו.
          </div>
          {(['approver', 'designer'] as Role[]).map((role) => (
            <div key={role} className="py-1">
              <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {ROLE_LABEL[role]}
              </div>
              {state.users
                .filter((u) => u.role === role)
                .map((u) => {
                  const count = pendingFor(u.id, role);
                  return (
                    <button
                      key={u.id}
                      role="menuitem"
                      onClick={() => switchTo(u.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-start hover:bg-slate-50"
                    >
                      <Avatar user={u} />
                      <span className="flex-1 leading-tight">
                        <span className="block text-sm font-medium text-slate-900">{u.name}</span>
                        <span className="block text-[11px] text-slate-500">{u.title}</span>
                      </span>
                      {count > 0 && (
                        <span
                          className={`rounded-full px-1.5 text-[11px] font-semibold ${
                            role === 'approver' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'
                          }`}
                          title={role === 'approver' ? 'ממתינים לאישור' : 'נדרשים תיקונים'}
                        >
                          {count}
                        </span>
                      )}
                      {u.id === currentUser.id && <Check className="h-4 w-4 text-brand-600" />}
                    </button>
                  );
                })}
            </div>
          ))}
          <button
            onClick={onReset}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <RotateCcw className="h-4 w-4" />
            איפוס דמו
          </button>
        </div>
      )}
    </div>
  );
}
