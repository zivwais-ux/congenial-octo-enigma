import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Activity, Check, ChevronDown, Clock3, Columns2, Download, Eye, EyeOff, Maximize2, MessageSquare, Minimize2, Minus, Plus, RotateCcw, Upload, X, type LucideIcon } from 'lucide-react';
import { MAX_ZOOM, MIN_ZOOM } from '../components/viewer/PreviewPane';
import { isPdf } from '../components/ui/FileThumb';
import { IconTile } from '../components/ui/IconTile';
import { ProjectChip } from '../components/ui/ProjectChip';
import type { Tone } from '../lib/status';
import type { Item, Pin, User } from '../types';
import { useLookups, useStore } from '../store/StoreProvider';
import { addComment, decide, deleteComment, toggleResolved } from '../store/actions';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DueLabel } from '../components/ui/DueLabel';
import { EmptyState } from '../components/ui/EmptyState';
import { PreviewPane, type NumberedPin } from '../components/viewer/PreviewPane';
import { CommentPanel } from '../components/viewer/CommentPanel';
import { Timeline } from '../components/viewer/Timeline';
import { DecisionPanel, type Decision } from '../components/viewer/DecisionPanel';
import { VersionTabs } from '../components/viewer/VersionTabs';
import { CompareView } from '../components/viewer/CompareView';
import { NewVersionModal } from '../components/upload/NewVersionModal';
import { downloadSource } from '../lib/download';
import { channelOf } from '../lib/status';
import { formatDate } from '../lib/dates';
import { firstName } from '../lib/copy';
import { approverQueue } from '../lib/queue';
import { useUI } from '../components/layout/UIContext';
import { NextUp, QueueNav } from '../components/viewer/ReviewQueue';

export function ItemPage() {
  const { id } = useParams();
  const { state } = useStore();
  const item = state.items.find((i) => i.id === id);
  if (!item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="העבודה לא נמצאה"
          text="ייתכן שההדגמה אופסה מאז שהקישור נפתח."
          action={
            <Link to="/" className="inline-flex h-9 items-center rounded-md bg-ink px-3.5 text-base font-medium text-white">
              חזרה לרשימה
            </Link>
          }
        />
      </div>
    );
  }
  return <ItemView key={item.id} item={item} />;
}

function ItemView({ item }: { item: Item }) {
  const { state, update, updateUndoable, currentUser } = useStore();
  const { userById, projectById } = useLookups();
  const toast = useToast();

  const latest = item.versions[item.versions.length - 1];
  const [viewId, setViewId] = useState(latest.id);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<'comments' | 'timeline'>('comments');
  const [showResolved, setShowResolved] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [compare, setCompare] = useState(false);
  const [newVersionOpen, setNewVersionOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [decided, setDecided] = useState<Decision | null>(null);
  const [zoom, setZoom] = useState(1);
  const [actualZoom, setActualZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const { reviewTally, recordDecision } = useUI();
  const navigate = useNavigate();

  // גרסה חדשה עלתה – עוברים אליה
  useEffect(() => {
    setViewId(latest.id);
    setCompare(false);
  }, [latest.id]);

  // פתיחת העבודה מסמנת את ההתראות שלה כנקראו
  useEffect(() => {
    update((s) =>
      s.notifications.some((n) => n.userId === currentUser.id && n.itemId === item.id && !n.read)
        ? { ...s, notifications: s.notifications.map((n) => (n.userId === currentUser.id && n.itemId === item.id ? { ...n, read: true } : n)) }
        : s,
    );
  }, [update, currentUser.id, item.id]);

  const version = item.versions.find((v) => v.id === viewId) ?? latest;
  const isLatest = version.id === latest.id;
  const versionIdx = item.versions.findIndex((v) => v.id === version.id);
  const canZoom = !isPdf(version);
  useEffect(() => setZoom(1), [version.id]);

  // מסך מלא על הבמה בלבד
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen?.();
  };
  const stepZoom = (dir: 1 | -1) => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((dir > 0 ? z * 1.5 : z / 1.5) * 100) / 100)));
  // קובץ המקור של הגרסה הנצפית, ואם אין לה – האחרון שהועלה
  const sourceVersion = version.sourceFileName ? version : [...item.versions].reverse().find((v) => v.sourceFileName);
  const designer = userById.get(item.designerId)!;
  const approver = userById.get(item.approverId)!;

  const itemComments = state.comments.filter((c) => c.itemId === item.id);
  const versionComments = itemComments.filter((c) => c.versionId === version.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // הערות ראשיות (עם סימון או כלליות); תגובות מוצגות בתוך השרשור של ההערה שאליה הן שייכות
  const topLevel = versionComments.filter((c) => !c.parentId);
  const replies = versionComments.filter((c) => c.parentId);
  const pinned: NumberedPin[] = topLevel.filter((c) => c.pin).map((comment, i) => ({ comment, number: i + 1 }));
  const general = topLevel.filter((c) => !c.pin);
  const openPins = pinned.filter((p) => !p.comment.resolved).length;
  const openCount = topLevel.filter((c) => !c.resolved).length;
  const olderCount = itemComments.filter((c) => c.versionId !== version.id).length;

  const isApprover = currentUser.id === item.approverId;
  const isDesigner = currentUser.id === item.designerId;
  const open = item.status === 'pending' || item.status === 'changes';
  const canPin = isLatest && open;
  const canDecide = isApprover && item.status === 'pending';
  // תור הסקירה של המאשר: מיקום העבודה הנוכחית, ומה הבא אחרי החלטה
  const queue = isApprover ? approverQueue(state, currentUser.id) : [];
  const queueIdx = queue.findIndex((i) => i.id === item.id);
  const nextUp = decided ? queue[0] : undefined;
  const goNext = () => nextUp && navigate(`/item/${nextUp.id}`);
  const lastDecision = [...item.events].reverse().find((e) => e.type === 'decision');

  const onAddPin = (pin: Pin, text: string) => {
    update((s) => addComment(s, item.id, version.id, text, pin));
    setShowPins(true);
    setTab('comments');
  };

  const onDecide = (d: Decision, text: string) => {
    const undo = updateUndoable((s) => decide(s, item.id, d, text));
    setDecided(d);
    recordDecision(d);
    const msg = { approved: 'העבודה אושרה ועברה לארכיון', changes: `בקשת התיקונים נשלחה ל${designer.name}`, rejected: 'העבודה נדחתה' }[d];
    toast(msg, {
      channel: channelOf(designer.id),
      action: {
        label: 'ביטול',
        onClick: () => {
          undo();
          setDecided(null);
          recordDecision(d, -1);
          toast('ההחלטה בוטלה. העבודה חזרה להמתין לאישור', { tone: 'info' });
        },
      },
    });
  };

  const onToggleResolved = (id: string) => {
    const wasResolved = state.comments.find((c) => c.id === id)?.resolved;
    const undo = updateUndoable((s) => toggleResolved(s, id));
    if (!wasResolved) toast('ההערה סומנה כטופלה', { action: { label: 'ביטול', onClick: undo } });
  };

  const onDelete = (id: string) => {
    const undo = updateUndoable((s) => deleteComment(s, id));
    setActiveId((a) => (a === id ? null : a));
    toast('ההערה נמחקה', { tone: 'info', action: { label: 'ביטול', onClick: undo } });
  };

  const selectFromList = (id: string | null) => {
    setActiveId(id);
    setShowPins(true);
    if (id && window.innerWidth < 1024) stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // קיצורי מקלדת לסקירה: J/K – הבאה/הקודמת בתור, Enter – לעבודה הבאה אחרי החלטה
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [role=dialog]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'j' && queueIdx >= 0 && queue[queueIdx + 1]) navigate(`/item/${queue[queueIdx + 1].id}`);
      else if (key === 'k' && queueIdx > 0) navigate(`/item/${queue[queueIdx - 1].id}`);
      else if (e.key === 'Enter' && nextUp && !el.closest('button, a')) navigate(`/item/${nextUp.id}`);
      // ← / → בין גרסאות (כמו סדר הלשוניות: שמאלה = ישנה יותר), +/-/0 לזום
      else if (e.key === 'ArrowLeft' && versionIdx > 0 && !compare) setViewId(item.versions[versionIdx - 1].id);
      else if (e.key === 'ArrowRight' && versionIdx < item.versions.length - 1 && !compare) setViewId(item.versions[versionIdx + 1].id);
      else if ((e.key === '+' || e.key === '=') && canZoom) stepZoom(1);
      else if (e.key === '-' && canZoom) stepZoom(-1);
      else if (e.key === '0' && canZoom) setZoom(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toolBtn = 'flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] transition';

  return (
    <div className={`anim-fade lg:flex lg:h-[calc(100vh-53px)] ${canDecide || nextUp ? 'pb-[88px] lg:pb-0' : ''}`}>
      {/* עמודה ראשית */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-stone-200/80 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1.5">
                <ProjectChip project={projectById.get(item.projectId)} size="xs" />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h1 className="text-[19px] font-semibold leading-7">{item.title}</h1>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-stone-500">
                <Person user={designer} label="עיצוב" />
                <Person user={approver} label="אישור" />
                <span className="flex items-center gap-1.5">
                  <span className="text-stone-400">דדליין</span>
                  <DueLabel dueDate={item.dueDate} status={item.status} />
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start">
            {queueIdx >= 0 && <QueueNav index={queueIdx} total={queue.length} prevId={queue[queueIdx - 1]?.id} nextId={queue[queueIdx + 1]?.id} />}
            {sourceVersion && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={() => {
                  void downloadSource(sourceVersion);
                  toast(`ההורדה של ${sourceVersion.sourceFileName} התחילה`, { tone: 'info' });
                }}
                data-testid="download-source"
              >
                <span className="max-w-[12rem] truncate text-sm font-normal" dir="ltr">
                  {sourceVersion.sourceFileName}
                </span>
              </Button>
            )}
            </div>
          </div>
        </header>

        {/* במה */}
        <div ref={stageRef} className="flex min-h-0 flex-1 scroll-mt-14 flex-col bg-stage">
          {compare ? (
            <>
              <div className="flex h-11 shrink-0 items-center justify-between border-b border-stage-line bg-stage-deep px-3">
                <span className="text-[13px] text-stone-200">השוואת גרסאות</span>
                <button onClick={() => setCompare(false)} className={`${toolBtn} text-stone-300 hover:bg-white/10 hover:text-white`} data-testid="compare-toggle">
                  סגירה
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <CompareView item={item} comments={itemComments} />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-11 shrink-0 items-center gap-2 border-b border-stage-line bg-stage-deep px-3">
                <VersionTabs
                  versions={item.versions}
                  value={version.id}
                  onChange={(v) => {
                    setViewId(v);
                    setActiveId(null);
                  }}
                />
                {!isLatest && <span className="hidden text-[12px] text-amber-300/90 sm:inline">גרסה קודמת, לצפייה בלבד</span>}
                <div className="ms-auto flex items-center gap-0.5">
                  {canZoom && (
                    <div className="me-1 flex items-center rounded-md bg-white/[0.06]" data-testid="zoom-controls">
                      <button onClick={() => stepZoom(-1)} disabled={zoom <= MIN_ZOOM} className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:text-white disabled:opacity-30" aria-label="הקטנה" title="הקטנה (-)">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setZoom((z) => (z > 1.001 ? 1 : Math.min(MAX_ZOOM, actualZoom)))}
                        className="num h-7 min-w-[3.25rem] px-1 text-[12px] text-stone-300 transition hover:text-white"
                        title={zoom > 1.001 ? 'חזרה להתאמה למסך (0)' : 'גודל אמיתי (100%)'}
                        data-testid="zoom-label"
                      >
                        {zoom > 1.001 ? `${Math.round((zoom / actualZoom) * 100)}%` : 'התאמה'}
                      </button>
                      <button onClick={() => stepZoom(1)} disabled={zoom >= MAX_ZOOM} className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:text-white disabled:opacity-30" aria-label="הגדלה" title="הגדלה (+)" data-testid="zoom-in">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {pinned.length > 0 && (
                    <button
                      onClick={() => setShowPins((v) => !v)}
                      className={`${toolBtn} ${showPins ? 'text-stone-400 hover:bg-white/[0.06] hover:text-white' : 'bg-white/[0.12] text-white'}`}
                      title={showPins ? 'הסתרת הסימונים' : 'הצגת הסימונים'}
                    >
                      {showPins ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">סימונים</span>
                    </button>
                  )}
                  {item.versions.length > 1 && (
                    <button onClick={() => setCompare(true)} className={`${toolBtn} text-stone-400 hover:bg-white/[0.06] hover:text-white`} data-testid="compare-toggle">
                      <Columns2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">השוואה</span>
                    </button>
                  )}
                  {typeof document !== 'undefined' && document.fullscreenEnabled && (
                    <button onClick={toggleFullscreen} className={`${toolBtn} text-stone-400 hover:bg-white/[0.06] hover:text-white`} title={fullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'} aria-label={fullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'} data-testid="fullscreen">
                      {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="relative min-h-0 flex-1">
                <div className="h-full overflow-auto max-lg:max-h-[75vh]" data-stage-scroll>
                  <PreviewPane
                    version={version}
                    pins={showPins ? pinned : []}
                    activeId={activeId}
                    onSelect={setActiveId}
                    onAddPin={canPin ? onAddPin : undefined}
                    showResolved={showResolved}
                    className="min-h-full max-lg:pb-16"
                    zoom={zoom}
                    onZoom={setZoom}
                    onActualSize={setActualZoom}
                    maxH={fullscreen ? 'max-h-[calc(100vh-7rem)]' : undefined}
                  />
                </div>
                {/* מובייל: קיצור דרך מהעבודה אל ההערות */}
                <button
                  onClick={() => asideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3 text-sm font-medium text-ink shadow-pop lg:hidden"
                  data-testid="jump-to-comments"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {openCount > 0 ? `${openCount} הערות` : 'הערות'}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* פאנל צד */}
      <aside ref={asideRef} className="flex min-h-[480px] scroll-mt-14 flex-col border-stone-200/80 bg-white lg:h-full lg:w-[360px] lg:shrink-0 lg:border-s xl:w-[380px]">
        {decided && isApprover && <NextUp next={nextUp} remaining={queue.length} tally={reviewTally} onGo={goNext} />}
        {canDecide && <DecisionPanel onDecide={onDecide} openPinCount={openPins} designerName={designer.name} itemTitle={item.title} versionNumber={latest.number} />}
        <StatusNote
          item={item}
          isDesigner={isDesigner}
          isApprover={isApprover}
          lastDecisionText={lastDecision?.text}
          lastDecisionAt={lastDecision?.at}
          approverName={approver.name}
          designerName={designer.name}
          onNewVersion={() => setNewVersionOpen(true)}
        />

        <div className="flex h-11 shrink-0 items-center gap-5 border-b border-stone-200/80 px-4" role="tablist">
          <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')}>
            <MessageSquare className="h-4 w-4 opacity-70" strokeWidth={1.9} />
            הערות
            {openCount > 0 && <span className="num text-xs text-signal-600">{openCount}</span>}
          </TabBtn>
          <TabBtn active={tab === 'timeline'} onClick={() => setTab('timeline')}>
            <Activity className="h-4 w-4 opacity-70" strokeWidth={1.9} />
            פעילות
          </TabBtn>
          <span className="ms-auto text-xs text-stone-400">גרסה {version.number}</span>
        </div>

        {tab === 'comments' ? (
          <CommentPanel
            version={version}
            designer={designer}
            pinned={pinned}
            general={general}
            activeId={activeId}
            onSelect={selectFromList}
            replies={replies}
            onToggleResolved={onToggleResolved}
            onDelete={onDelete}
            onAddGeneral={(text) => update((s) => addComment(s, item.id, version.id, text))}
            onReply={(parentId, text, resolve) => {
              update((s) => {
                const next = addComment(s, item.id, version.id, text, undefined, parentId);
                return resolve ? toggleResolved(next, parentId) : next;
              });
              if (resolve) toast('התגובה נשלחה וההערה סומנה כטופלה');
            }}
            showResolved={showResolved}
            onShowResolved={setShowResolved}
            olderCount={olderCount}
            canPin={canPin}
          />
        ) : (
          <div className="scroll-thin flex-1 overflow-y-auto">
            <Timeline item={item} />
          </div>
        )}
      </aside>
      {isDesigner && <NewVersionModal item={item} open={newVersionOpen} onClose={() => setNewVersionOpen(false)} />}
    </div>
  );
}

function Person({ label, user }: { label: string; user: User }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-stone-400">{label}</span>
      <Avatar user={user} size="xs" />
      <span className="text-stone-700">{user.name}</span>
    </span>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px flex h-11 items-center gap-1.5 border-b text-sm transition-colors ${active ? 'border-ink font-medium text-ink' : 'border-transparent text-stone-500 hover:text-ink'}`}
    >
      {children}
    </button>
  );
}

/** מצב העבודה מנקודת המבט של המשתמש הנוכחי */
function StatusNote({
  item,
  isDesigner,
  isApprover,
  lastDecisionText,
  lastDecisionAt,
  approverName,
  designerName,
  onNewVersion,
}: {
  item: Item;
  isDesigner: boolean;
  isApprover: boolean;
  lastDecisionText?: string;
  lastDecisionAt?: string;
  approverName: string;
  designerName: string;
  onNewVersion: () => void;
}) {
  const quote = lastDecisionText && <p className="mt-2.5 rounded-lg bg-white px-3 py-2 text-base leading-6 text-stone-700 ring-1 ring-inset ring-stone-200/80">{lastDecisionText}</p>;
  const TONES: Record<string, { icon: LucideIcon; tone: Tone; bg: string }> = {
    'bg-sky-600': { icon: Clock3, tone: 'sky', bg: 'bg-sky-50/50' },
    'bg-amber-500': { icon: RotateCcw, tone: 'amber', bg: 'bg-amber-50/50' },
    'bg-emerald-600': { icon: Check, tone: 'emerald', bg: 'bg-emerald-50/50' },
    'bg-red-600': { icon: X, tone: 'red', bg: 'bg-red-50/40' },
  };
  const wrap = (dot: string, title: string, children?: React.ReactNode, testId?: string) => (
    <div className={`border-b border-stone-200/80 px-4 py-4 ${TONES[dot].bg}`} data-testid={testId}>
      <div className="flex items-center gap-2.5 text-sm font-medium text-ink">
        <IconTile icon={TONES[dot].icon} tone={TONES[dot].tone} />
        {title}
      </div>
      {children}
    </div>
  );

  if (item.status === 'pending') {
    if (isApprover) return null;
    return wrap('bg-sky-600', `ממתין להחלטה של ${approverName}`, <p className="mt-1 text-sm text-stone-500">{isDesigner ? 'כשתהיה החלטה, תגיע אליך התראה.' : `גרסה ${item.versions.length} נשלחה לאישור.`}</p>);
  }
  if (item.status === 'changes') {
    return wrap(
      'bg-amber-500',
      isDesigner ? `הערות מ${approverName}` : `הוחזר ל${firstName(designerName)} לתיקונים`,
      <>
        {quote}
        {isDesigner && (
          <Button variant="primary" block className="mt-3" icon={<Upload className="h-4 w-4" />} onClick={onNewVersion} data-testid="upload-version-btn">
            העלאת גרסה {item.versions.length + 1}
          </Button>
        )}
      </>,
      'changes-banner',
    );
  }
  if (item.status === 'approved') {
    return wrap(
      'bg-emerald-600',
      `אושר${lastDecisionAt ? ` ב-${formatDate(lastDecisionAt)}` : ''} על ידי ${approverName}`,
      <>
        {quote}
        <Link to="/archive" className="mt-2 inline-block text-sm text-stone-500 underline decoration-stone-300 underline-offset-4 transition hover:text-ink">
          נשמר בארכיון
        </Link>
      </>,
    );
  }
  return wrap('bg-red-600', `נדחה על ידי ${approverName}`, quote);
}
