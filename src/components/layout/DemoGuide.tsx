import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, RotateCcw, Sparkles, X } from 'lucide-react';
import { useLookups, useStore } from '../../store/StoreProvider';
import { useSwitchUser } from '../../hooks/useSwitchUser';
import { tourSteps } from '../../lib/tour';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { useUI } from './UIContext';

/** מדריך ההדגמה: חמשת צעדי התסריט להנהלה, מתעדכן לבד תוך כדי ההצגה */
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
      <div className="anim-fade fixed inset-0 z-[60] bg-zinc-950/20 lg:bg-transparent" onClick={() => setGuideOpen(false)} />
      <aside
        className="anim-sheet fixed inset-x-0 bottom-0 z-[65] max-h-[85vh] overflow-y-auto rounded-t-2xl border border-zinc-200 bg-white shadow-pop sm:inset-x-auto sm:bottom-6 sm:end-6 sm:w-[24rem] sm:rounded-2xl"
        role="dialog"
        aria-label="מדריך ההדגמה"
        data-testid="demo-guide"
      >
        <div className="relative overflow-hidden border-b border-zinc-100 bg-gradient-to-br from-brand-600 to-brand-800 px-5 pb-5 pt-4 text-white">
          <div className="pointer-events-none absolute -end-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-200" />
            <span className="text-[13px] font-semibold text-brand-100">מדריך ההדגמה</span>
            <button onClick={() => setGuideOpen(false)} className="ms-auto rounded-md p-1 text-brand-100 transition hover:bg-white/10 hover:text-white" aria-label="סגירה">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-2 text-lg font-bold leading-snug">
            {allDone ? 'עברתם את כל התסריט' : nextIdx === 0 ? 'חמישה צעדים, חמש דקות' : `צעד ${nextIdx + 1} מתוך ${steps.length}`}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-brand-100">
            {allDone
              ? 'מעלייה ועד ארכיון, בלי מייל אחד. רעננו את הדף כדי להראות שהכל נשמר.'
              : 'כל צעד מחליף לתצוגה של המשתמש הנכון ופותח את המסך. הסימונים מתעדכנים לבד.'}
          </p>
          <div className="mt-4 flex gap-1">
            {steps.map((s) => (
              <span key={s.key} className={`h-1 flex-1 rounded-full ${s.done ? 'bg-white' : 'bg-white/25'}`} />
            ))}
          </div>
        </div>

        <ol className="p-2">
          {steps.map((s, i) => {
            const current = i === nextIdx;
            const user = s.userId ? userById.get(s.userId) : undefined;
            return (
              <li key={s.key} className={`rounded-xl p-3 ${current ? 'bg-brand-50/70 ring-1 ring-brand-200' : ''}`}>
                <div className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      s.done ? 'bg-emerald-500 text-white' : current ? 'bg-brand-600 text-white' : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {s.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold ${s.done ? 'text-zinc-500 line-through decoration-zinc-300' : 'text-zinc-900'}`}>{s.title}</div>
                    {!s.done && <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-500">{s.text}</p>}
                    {current && (s.path || s.userId) && (
                      <button
                        onClick={() => go(i)}
                        className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 py-1.5 pe-2.5 ps-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                        data-testid="guide-go"
                      >
                        {user && <Avatar user={user} size="xs" ring={false} />}
                        {user && user.id !== currentUser.id ? `עוברים ל${user.name}` : 'למסך הזה'}
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">
          <span>לפני כל הצגה כדאי להתחיל מאיפוס</span>
          <button
            onClick={() => {
              if (!confirm('לאפס את ההדגמה?\nכל השינויים והקבצים שהועלו יימחקו.')) return;
              resetDemo();
              navigate('/');
              toast('ההדגמה אופסה. אפשר להתחיל מההתחלה', { tone: 'info' });
            }}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            איפוס הדגמה
          </button>
        </div>
      </aside>
    </>
  );
}
