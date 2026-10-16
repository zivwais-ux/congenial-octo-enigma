import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MessageSquareText, PlayCircle, ShieldCheck, Archive, type LucideIcon } from 'lucide-react';
import type { User } from '../../types';
import { useStore } from '../../store/StoreProvider';
import { useSwitchUser } from '../../hooks/useSwitchUser';
import { works } from '../../lib/copy';
import { Avatar } from '../ui/Avatar';
import { IconTile } from '../ui/IconTile';
import { LogoMark } from './Logo';
import { useUI } from './UIContext';

const APPROVER_ID = 'u1';
const DESIGNER_ID = 'u3';

/** מסך פתיחה: מוצג בכניסה הראשונה ואחרי איפוס, כדי להסביר מה רואים ולבחור צד */
export function Welcome() {
  const { state, update } = useStore();
  const { setGuideOpen } = useUI();
  const switchUser = useSwitchUser();
  const navigate = useNavigate();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const approver = state.users.find((u) => u.id === APPROVER_ID);
  const designer = state.users.find((u) => u.id === DESIGNER_ID);
  if (!approver || !designer) return null;

  const pending = state.items.filter((i) => i.approverId === approver.id && i.status === 'pending').length;
  const toFix = state.items.filter((i) => i.designerId === designer.id && i.status === 'changes').length;
  const atApprovers = state.items.filter((i) => i.designerId === designer.id && i.status === 'pending').length;

  const finish = (userId?: string, guide = false) => {
    if (userId) switchUser(userId, true);
    update((s) => ({ ...s, tour: { ...s.tour, welcomed: true } }));
    navigate('/');
    if (guide) setGuideOpen(true);
  };

  return (
    <div className="anim-fade fixed inset-0 z-[70] overflow-y-auto bg-stone-50" role="dialog" aria-modal="true" aria-labelledby="welcome-title" data-testid="welcome">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="text-lg leading-none">
            <span className="font-semibold text-ink">גדות</span>
            <span className="ms-1 text-stone-400">סטודיו</span>
          </span>
          <span className="ms-2 rounded bg-signal-50 px-1.5 py-0.5 text-xs font-medium text-signal-700">סקיצה להדגמה</span>
        </div>

        <h1 id="welcome-title" className="mt-8 text-[26px] font-semibold leading-tight text-ink sm:text-[32px]">
          אישור עבודות גרפיות,
          <br className="hidden sm:block" /> בלי לרדוף אחרי מיילים.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-stone-600">
          המעצב מעלה עבודה, המאשר מסמן הערות ישירות על התמונה ומחליט. כל גרסה נשמרת, וההתראה מגיעה לערוץ שבו כל אחד כבר עובד.
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
          <Feature icon={MessageSquareText} text="הערות על נקודה בעבודה" />
          <Feature icon={ShieldCheck} text="החלטה ברורה עם תיעוד" />
          <Feature icon={Bell} text="מייל, Teams או וואטסאפ" />
          <Feature icon={Archive} text="ארכיון עם קבצי מקור" />
        </ul>

        <div className="mt-8 text-sm font-medium text-stone-500">מאיזה צד להתחיל?</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RoleCard
            user={approver}
            role="מאשר/ת"
            text="לעבור על התור, לסמן הערות ולאשר."
            stat={pending ? `${works(pending)} מחכות להחלטה` : 'אין עבודות ממתינות'}
            onClick={() => finish(approver.id)}
            testId="welcome-approver"
          />
          <RoleCard
            user={designer}
            role="מעצב/ת"
            text="להעלות עבודה, לקבל הערות ולשלוח גרסה מתוקנת."
            stat={toFix ? `${toFix === 1 ? 'עבודה אחת חזרה' : `${toFix} עבודות חזרו`} לתיקונים` : `${works(atApprovers)} אצל המאשרים`}
            onClick={() => finish(designer.id)}
            testId="welcome-designer"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button onClick={() => finish(undefined, true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition hover:text-signal-700" data-testid="welcome-guide">
            <PlayCircle className="h-4 w-4" />
            להתחיל את תסריט ההדגמה (5 צעדים)
          </button>
          <button onClick={() => finish()} className="text-sm text-stone-500 transition hover:text-ink" data-testid="welcome-skip">
            לדלג
          </button>
        </div>
        <p className="mt-8 text-xs text-stone-400">אפשר להחליף משתמש בכל רגע מהתפריט שבתחתית הסרגל. הנתונים נשמרים בדפדפן בלבד.</p>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-stone-400" strokeWidth={1.75} />
      {text}
    </li>
  );
}

function RoleCard({ user, role, text, stat, onClick, testId }: { user: User; role: string; text: string; stat: string; onClick: () => void; testId: string }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-xl border border-stone-200 bg-white p-4 text-start shadow-xs transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-pop sm:p-5"
      data-testid={testId}
    >
      <div className="flex items-center gap-3">
        <Avatar user={user} size="lg" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-xs text-stone-500">להיכנס כ{role}</div>
          <div className="mt-0.5 text-base font-semibold text-ink">{user.name}</div>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition group-hover:bg-ink group-hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{text}</p>
      <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3 text-sm">
        <IconTile icon={role.startsWith('מאשר') ? ShieldCheck : MessageSquareText} tone={role.startsWith('מאשר') ? 'sky' : 'amber'} size="sm" />
        <span className="font-medium text-ink">{stat}</span>
      </div>
    </button>
  );
}
