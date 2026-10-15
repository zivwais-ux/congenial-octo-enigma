import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react';
import { useLookups, useStore } from '../../store/StoreProvider';
import { useSwitchUser } from '../../hooks/useSwitchUser';
import { tourSteps } from '../../lib/tour';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { useUI } from './UIContext';

/** תסריט ההדגמה: חמשת הצעדים להצגה להנהלה, מתעדכן לבד תוך כדי */
export function DemoGuide() {
  const { guideOpen, setGuideOpen } = useUI();
  const { state, currentUser, resetDemo } = useStore();
  const { userById } = useLookups();
  const switchUser = useSwitchUser();
  const navigate = useNavigate();
  const toast = useToast();
  const steps = tourSteps(state);
  const nextIdx = steps.findIndex((s) => !s.done);
  const allDone = nextIdx === -1;
  const doneCount = steps.filter((s) => s.done).length;

  if (!guideOpen) return null;

  const go = (i: number) => {
    const s = steps[i];
    if (s.userId) switchUser(s.userId, true);
    if (s.path) navigate(s.path);
    setGuideOpen(false);
    const u = s.userId ? userById.get(s.userId) : undefined;
    toast(u ? `צעד ${i + 1}: ${s.title} · בתצוגה של ${u.name}` : `צעד ${i + 1}: ${s.title}`, { tone: 'info' });
  };

  return (
    <>
      <div className="anim-fade fixed inset-0 z-[60] bg-stone-950/20 sm:bg-transparent" onClick={() => setGuideOpen(false)} />
      <aside
        className="anim-sheet fixed inset-x-0 bottom-0 z-[65] max-h-[85vh] overflow-y-auto rounded-t-xl border border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-pop sm:inset-x-auto sm:bottom-5 sm:end-5 sm:w-[22rem] sm:rounded-xl"
        role="dialog"
        aria-label="תסריט ההדגמה"
        data-testid="demo-guide"
      >
        <div className="flex items-start gap-3 border-b border-stone-200/80 px-5 pb-4 pt-5">
          <div className="flex-1">
            <div className="mono text-stone-400">
              {doneCount}/{steps.length}
            </div>
            <h2 className="mt-1 text-[16px] font-semibold">{allDone ? 'התסריט הושלם' : 'תסריט ההדגמה'}</h2>
            <p className="mt-1 text-sm text-stone-500">
              {allDone ? 'מהעלאה ועד ארכיון, בלי מייל אחד. רעננו את הדף כדי להראות שהכל נשמר.' : 'כל צעד עובר לתצוגה של המשתמש הנכון ופותח את המסך. הסימון מתעדכן לבד.'}
            </p>
          </div>
          <button onClick={() => setGuideOpen(false)} className="-me-1.5 -mt-1 rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-ink" aria-label="סגירה">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="px-5 py-2">
          {steps.map((s, i) => {
            const current = i === nextIdx;
            const user = s.userId ? userById.get(s.userId) : undefined;
            return (
              <li key={s.key} className="flex gap-3 border-b border-stone-100 py-3.5 last:border-0">
                <span
                  className={`num mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                    s.done ? 'bg-ink text-white' : current ? 'border border-ink text-ink' : 'border border-stone-300 text-stone-400'
                  }`}
                >
                  {s.done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-medium ${s.done ? 'text-stone-400' : 'text-ink'}`}>{s.title}</div>
                  {current && <p className="mt-1 text-sm text-stone-500">{s.text}</p>}
                  {current && (s.path || s.userId) && (
                    <button
                      onClick={() => go(i)}
                      className="mt-3 inline-flex h-8 items-center gap-2 rounded-md bg-ink pe-2.5 ps-1.5 text-sm font-medium text-white transition hover:bg-stone-800"
                      data-testid="guide-go"
                    >
                      {user && <Avatar user={user} size="xs" />}
                      {user && user.id !== currentUser.id ? `מעבר ל${user.name}` : 'פתיחת המסך'}
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between border-t border-stone-200/80 bg-stone-50 px-5 py-3 text-xs text-stone-500">
          <span>מומלץ לאפס לפני כל הצגה</span>
          <button
            onClick={() => {
              if (!confirm('לאפס את ההדגמה?\nכל השינויים והקבצים שהועלו יימחקו.')) return;
              resetDemo();
              navigate('/');
              toast('ההדגמה אופסה', { tone: 'info' });
            }}
            className="flex items-center gap-1.5 font-medium text-stone-600 transition hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            איפוס
          </button>
        </div>
      </aside>
    </>
  );
}
