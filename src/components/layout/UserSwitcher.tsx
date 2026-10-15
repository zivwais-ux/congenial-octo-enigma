import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/StoreProvider';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useSwitchUser } from '../../hooks/useSwitchUser';
import { useToast } from '../ui/Toast';
import { Avatar } from '../ui/Avatar';
import type { Role } from '../../types';

const ROLE_LABEL: Record<Role, string> = { approver: 'מאשרים', designer: 'מעצבים' };

/** "החלפת משתמש" לצורכי הדגמה. variant=sidebar – כרטיס בתחתית הסרגל; compact – אווטאר בלבד */
export function UserSwitcher({ variant = 'sidebar' }: { variant?: 'sidebar' | 'compact' }) {
  const { state, currentUser, resetDemo } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);
  const switchUser = useSwitchUser();
  const toast = useToast();
  const navigate = useNavigate();

  const waitingFor = (userId: string, role: Role) =>
    state.items.filter((i) => (role === 'approver' ? i.approverId === userId && i.status === 'pending' : i.designerId === userId && i.status === 'changes'))
      .length;

  const onReset = () => {
    if (!confirm('לאפס את ההדגמה?\nכל השינויים והקבצים שהועלו יימחקו, והנתונים יחזרו למצב ההתחלה.')) return;
    resetDemo();
    setOpen(false);
    navigate('/');
    toast('ההדגמה אופסה. אפשר להתחיל מההתחלה', { tone: 'info' });
  };

  return (
    <div ref={ref} className="relative">
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-200 bg-white p-2 text-start shadow-sm shadow-zinc-900/[0.02] transition hover:border-zinc-300"
          aria-haspopup="menu"
          aria-expanded={open}
          data-testid="user-switcher"
        >
          <Avatar user={currentUser} ring={false} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold text-zinc-900">{currentUser.name}</span>
            <span className="block truncate text-[11px] text-zinc-500">{currentUser.title}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-zinc-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center rounded-full p-0.5 transition hover:ring-4 hover:ring-zinc-100"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`משתמש נוכחי: ${currentUser.name}. החלפת משתמש`}
          data-testid="user-switcher"
        >
          <Avatar user={currentUser} ring={false} />
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={`anim-pop absolute z-50 w-[19rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-pop ${
            variant === 'sidebar' ? 'bottom-full start-0 mb-2' : 'end-0 top-full mt-2'
          }`}
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="text-[13px] font-semibold text-zinc-900">צפייה בתור…</div>
            <div className="mt-0.5 text-[11px] leading-snug text-zinc-500">בהדגמה עוברים בין משתמשים כדי לראות את שני הצדדים. במערכת האמיתית כל אחד נכנס עם החשבון שלו.</div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto py-1">
            {(['approver', 'designer'] as Role[]).map((role) => (
              <div key={role} className="py-1">
                <div className="px-4 pb-1 pt-1.5 text-[11px] font-semibold text-zinc-400">{ROLE_LABEL[role]}</div>
                {state.users
                  .filter((u) => u.role === role)
                  .map((u) => {
                    const count = waitingFor(u.id, role);
                    const selected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        role="menuitem"
                        onClick={() => {
                          switchUser(u.id);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 px-4 py-2 text-start transition ${selected ? 'bg-brand-50/60' : 'hover:bg-zinc-50'}`}
                      >
                        <Avatar user={u} ring={false} />
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block text-sm font-medium text-zinc-900">{u.name}</span>
                          <span className="block text-[11px] text-zinc-500">{u.title}</span>
                        </span>
                        {count > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-px text-[11px] font-bold ${role === 'approver' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-800'}`}
                            title={role === 'approver' ? 'מחכות להחלטה' : 'חזרו לתיקונים'}
                          >
                            {count}
                          </span>
                        )}
                        {selected && <Check className="h-4 w-4 text-brand-600" />}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
          <button
            onClick={onReset}
            className="flex w-full items-center gap-2 border-t border-zinc-100 px-4 py-3 text-[13px] font-medium text-zinc-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <RotateCcw className="h-4 w-4" />
            איפוס הדגמה
            <span className="ms-auto text-[11px] font-normal text-zinc-400">חזרה לנתוני ההתחלה</span>
          </button>
        </div>
      )}
    </div>
  );
}
