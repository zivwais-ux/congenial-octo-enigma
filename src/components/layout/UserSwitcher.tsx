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

/** "החלפת משתמש" לצורכי הדגמה. sidebar – שורה בתחתית הסרגל; compact – אווטאר בלבד */
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
    toast('ההדגמה אופסה', { tone: 'info' });
  };

  return (
    <div ref={ref} className="relative">
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-start transition hover:bg-stone-100"
          aria-haspopup="menu"
          aria-expanded={open}
          data-testid="user-switcher"
        >
          <Avatar user={currentUser} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-medium text-ink">{currentUser.name}</span>
            <span className="block truncate text-xs text-stone-500">{currentUser.title}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-stone-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex rounded-full transition hover:opacity-90"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`משתמש נוכחי: ${currentUser.name}. החלפת משתמש`}
          data-testid="user-switcher"
        >
          <Avatar user={currentUser} />
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={`anim-pop absolute z-50 w-72 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-pop ${variant === 'sidebar' ? 'bottom-full start-0 mb-1.5' : 'end-0 top-full mt-2'}`}
        >
          <div className="border-b border-stone-100 px-3.5 py-3">
            <div className="text-sm font-medium">צפייה בתור</div>
            <div className="mt-0.5 text-xs text-stone-500">בהדגמה עוברים בין משתמשים כדי לראות את שני הצדדים.</div>
          </div>
          <div className="max-h-[52vh] overflow-y-auto py-1">
            {(['approver', 'designer'] as Role[]).map((role) => (
              <div key={role} className="py-1">
                <div className="px-3.5 pb-1 text-xs text-stone-400">{ROLE_LABEL[role]}</div>
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
                        className="flex w-full items-center gap-2.5 px-3.5 py-1.5 text-start transition hover:bg-stone-50"
                      >
                        <Avatar user={u} size="sm" />
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block text-sm text-ink">{u.name}</span>
                          <span className="block text-xs text-stone-500">{u.title}</span>
                        </span>
                        {count > 0 && (
                          <span className={`num text-xs ${role === 'approver' ? 'text-stone-500' : 'text-amber-700'}`} title={role === 'approver' ? 'מחכות להחלטה' : 'חזרו לתיקונים'}>
                            {count}
                          </span>
                        )}
                        <Check className={`h-4 w-4 text-ink ${selected ? '' : 'invisible'}`} />
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
          <button onClick={onReset} className="flex w-full items-center gap-2 border-t border-stone-100 px-3.5 py-2.5 text-sm text-stone-600 transition hover:bg-stone-50 hover:text-ink">
            <RotateCcw className="h-3.5 w-3.5" />
            איפוס ההדגמה
          </button>
        </div>
      )}
    </div>
  );
}
