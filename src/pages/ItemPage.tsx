import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Columns2, Download, Eye, EyeOff, Upload } from 'lucide-react';
import type { Item, Pin, User } from '../types';
import { useLookups, useStore } from '../store/StoreProvider';
import { addComment, decide, toggleResolved } from '../store/actions';
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
  const { state, update, currentUser } = useStore();
  const { userById } = useLookups();
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
  // קובץ המקור של הגרסה הנצפית, ואם אין לה – האחרון שהועלה
  const sourceVersion = version.sourceFileName ? version : [...item.versions].reverse().find((v) => v.sourceFileName);
  const designer = userById.get(item.designerId)!;
  const approver = userById.get(item.approverId)!;

  const itemComments = state.comments.filter((c) => c.itemId === item.id);
  const versionComments = itemComments.filter((c) => c.versionId === version.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const pinned: NumberedPin[] = versionComments.filter((c) => c.pin).map((comment, i) => ({ comment, number: i + 1 }));
  const general = versionComments.filter((c) => !c.pin);
  const openPins = pinned.filter((p) => !p.comment.resolved).length;
  const openCount = versionComments.filter((c) => !c.resolved).length;
  const olderCount = itemComments.filter((c) => c.versionId !== version.id).length;

  const isApprover = currentUser.id === item.approverId;
  const isDesigner = currentUser.id === item.designerId;
  const open = item.status === 'pending' || item.status === 'changes';
  const canPin = isLatest && open;
  const canDecide = isApprover && item.status === 'pending';
  const lastDecision = [...item.events].reverse().find((e) => e.type === 'decision');

  const onAddPin = (pin: Pin, text: string) => {
    update((s) => addComment(s, item.id, version.id, text, pin));
    setShowPins(true);
    setTab('comments');
  };

  const onDecide = (d: Decision, text: string) => {
    update((s) => decide(s, item.id, d, text));
    const msg = { approved: 'העבודה אושרה ועברה לארכיון', changes: `בקשת התיקונים נשלחה ל${designer.name}`, rejected: 'העבודה נדחתה' }[d];
    toast(msg, { channel: channelOf(designer.id) });
  };

  const selectFromList = (id: string | null) => {
    setActiveId(id);
    setShowPins(true);
    if (id && window.innerWidth < 1024) stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toolBtn = 'flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] transition';

  return (
    <div className={`anim-fade lg:flex lg:h-[calc(100vh-53px)] ${canDecide ? 'pb-[88px] lg:pb-0' : ''}`}>
      {/* עמודה ראשית */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-stone-200/80 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
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
            {sourceVersion && (
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
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
                      השוואה
                    </button>
                  )}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                <PreviewPane
                  version={version}
                  pins={showPins ? pinned : []}
                  activeId={activeId}
                  onSelect={setActiveId}
                  onAddPin={canPin ? onAddPin : undefined}
                  showResolved={showResolved}
                  className="min-h-full"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* פאנל צד */}
      <aside className="flex min-h-[480px] flex-col border-stone-200/80 bg-white lg:h-full lg:w-[360px] lg:shrink-0 lg:border-s xl:w-[380px]">
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
            הערות
            {openCount > 0 && <span className="num text-xs text-signal-600">{openCount}</span>}
          </TabBtn>
          <TabBtn active={tab === 'timeline'} onClick={() => setTab('timeline')}>
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
            onToggleResolved={(id) => update((s) => toggleResolved(s, id))}
            onAddGeneral={(text) => update((s) => addComment(s, item.id, version.id, text))}
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
  const quote = lastDecisionText && <p className="mt-2 border-s-2 border-stone-200 ps-3 text-base leading-6 text-stone-700">{lastDecisionText}</p>;
  const wrap = (dot: string, title: string, children?: React.ReactNode, testId?: string) => (
    <div className="border-b border-stone-200/80 px-4 py-4" data-testid={testId}>
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
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
