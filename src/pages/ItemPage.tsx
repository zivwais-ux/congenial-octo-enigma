import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Columns2, Download, Eye, EyeOff, FileQuestion, Layers, Upload, Wrench, XCircle } from 'lucide-react';
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
import { formatDate, formatDateTime } from '../lib/dates';
import { firstName } from '../lib/copy';

export function ItemPage() {
  const { id } = useParams();
  const { state } = useStore();
  const item = state.items.find((i) => i.id === id);
  if (!item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon={<FileQuestion className="h-6 w-6" />}
          title="העבודה לא נמצאה"
          text="ייתכן שההדגמה אופסה מאז שנפתח הקישור."
          action={
            <Link to="/" className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white">
              חזרה לסקירה
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
  const previewRef = useRef<HTMLDivElement>(null);

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
  const project = projectById.get(item.projectId);
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
  };

  const onDecide = (d: Decision, text: string) => {
    update((s) => decide(s, item.id, d, text));
    const msg = { approved: 'העבודה אושרה ועברה לארכיון', changes: `בקשת התיקונים נשלחה ל${designer.name}`, rejected: 'העבודה נדחתה' }[d];
    toast(msg, { channel: channelOf(designer.id) });
  };

  const selectFromList = (id: string | null) => {
    setActiveId(id);
    setShowPins(true);
    if (id && window.innerWidth < 1024) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`anim-rise mx-auto max-w-[100rem] px-4 py-5 sm:px-6 lg:px-8 lg:py-6 ${canDecide ? 'pb-32 lg:pb-6' : ''}`}>
      {/* כותרת */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 lg:hidden">
            <span className="h-2 w-2 rounded-[3px]" style={{ backgroundColor: project?.color }} />
            {project?.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 lg:mt-0">
            <h1 className="text-[22px] font-extrabold tracking-tight text-zinc-900 sm:text-2xl">{item.title}</h1>
            <StatusBadge status={item.status} size="md" />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-zinc-500">
            <Person label="עיצוב" user={designer} />
            <Person label="אישור" user={approver} />
            <DueLabel dueDate={item.dueDate} status={item.status} />
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {item.versions.length === 1 ? 'גרסה אחת' : `${item.versions.length} גרסאות`}
            </span>
          </div>
        </div>
        {sourceVersion && (
          <Button
            variant="secondary"
            className="self-start lg:self-auto"
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              void downloadSource(sourceVersion);
              toast(`ההורדה של ${sourceVersion.sourceFileName} התחילה`, { tone: 'info' });
            }}
            data-testid="download-source"
          >
            <span className="max-w-[14rem] truncate" dir="ltr">
              {sourceVersion.sourceFileName}
            </span>
            {sourceVersion.id !== version.id && <span className="text-xs font-normal text-zinc-400">מגרסה {sourceVersion.number}</span>}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_23rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
        {/* במה */}
        <div ref={previewRef} className="min-w-0 scroll-mt-20">
          <div className="overflow-hidden rounded-2xl bg-stage shadow-lift ring-1 ring-zinc-900/10">
            {!compare && (
              <div className="flex flex-wrap items-center gap-2 border-b border-stage-line bg-stage-deep px-3 py-2.5">
                <VersionTabs
                  versions={item.versions}
                  value={version.id}
                  onChange={(v) => {
                    setViewId(v);
                    setActiveId(null);
                  }}
                />
                {!isLatest && <span className="rounded-md bg-amber-400/15 px-2 py-1 text-[11px] font-semibold text-amber-300">גרסה קודמת · לצפייה בלבד</span>}
                <div className="ms-auto flex items-center gap-1">
                  {pinned.length > 0 && (
                    <StageBtn onClick={() => setShowPins((v) => !v)} active={!showPins} label={showPins ? 'הסתרת סימונים' : 'הצגת סימונים'}>
                      {showPins ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </StageBtn>
                  )}
                  {item.versions.length > 1 && (
                    <StageBtn onClick={() => setCompare(true)} label="השוואת גרסאות" wide testId="compare-toggle">
                      <Columns2 className="h-4 w-4" />
                      השוואה
                    </StageBtn>
                  )}
                </div>
              </div>
            )}
            {compare ? (
              <div>
                <div className="flex items-center justify-between border-b border-stage-line bg-stage-deep px-3 py-2">
                  <span className="text-[13px] font-semibold text-zinc-100">השוואת גרסאות</span>
                  <StageBtn onClick={() => setCompare(false)} label="חזרה לתצוגה רגילה" wide testId="compare-toggle">
                    סגירת השוואה
                  </StageBtn>
                </div>
                <CompareView item={item} comments={itemComments} />
              </div>
            ) : (
              <PreviewPane
                version={version}
                pins={showPins ? pinned : []}
                activeId={activeId}
                onSelect={setActiveId}
                onAddPin={canPin ? onAddPin : undefined}
                showResolved={showResolved}
              />
            )}
          </div>

          {!compare && version.note && (
            <div className="mt-3 flex gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <Avatar user={designer} size="sm" ring={false} />
              <div className="min-w-0 text-sm">
                <div className="text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-800">{designer.name}</span> · הערה לגרסה {version.number} · {formatDateTime(version.uploadedAt)}
                </div>
                <p className="mt-0.5 leading-relaxed text-zinc-700">{version.note}</p>
              </div>
            </div>
          )}
        </div>

        {/* פאנל צד */}
        <aside className="flex min-h-[460px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card lg:sticky lg:top-[4.75rem] lg:h-[calc(100vh-10.75rem)] lg:min-h-[520px]">
          {canDecide && <DecisionPanel onDecide={onDecide} openPinCount={openPins} designerName={designer.name} itemTitle={item.title} versionNumber={latest.number} />}
          <StatusBanner
            item={item}
            isDesigner={isDesigner}
            isApprover={isApprover}
            lastDecisionText={lastDecision?.text}
            lastDecisionAt={lastDecision?.at}
            approverName={approver.name}
            designerName={designer.name}
            onNewVersion={() => setNewVersionOpen(true)}
          />

          <div className="flex gap-1 border-b border-zinc-200 px-3" role="tablist">
            <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')}>
              הערות
              {openCount > 0 && <span className="rounded-full bg-rose-50 px-1.5 text-[11px] font-bold text-rose-600">{openCount}</span>}
            </TabBtn>
            <TabBtn active={tab === 'timeline'} onClick={() => setTab('timeline')}>
              פעילות
              <span className="text-[11px] text-zinc-400">{item.events.length}</span>
            </TabBtn>
            <span className="ms-auto self-center text-[11px] text-zinc-400">גרסה {version.number}</span>
          </div>

          {tab === 'comments' ? (
            <CommentPanel
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
      </div>
      {isDesigner && <NewVersionModal item={item} open={newVersionOpen} onClose={() => setNewVersionOpen(false)} />}
    </div>
  );
}

function Person({ label, user }: { label: string; user: User }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-zinc-400">{label}</span>
      <Avatar user={user} size="xs" ring={false} />
      <span className="font-medium text-zinc-700">{user.name}</span>
    </span>
  );
}

function StageBtn({ onClick, label, active, wide, testId, children }: { onClick: () => void; label: string; active?: boolean; wide?: boolean; testId?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      data-testid={testId}
      className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-[13px] font-semibold transition ${wide ? 'px-2.5' : 'w-8'} ${
        active ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px flex items-center gap-1.5 border-b-2 px-2 py-3 text-sm font-semibold transition ${
        active ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'
      }`}
    >
      {children}
    </button>
  );
}

function StatusBanner({
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
  const quote = lastDecisionText && <p className="mt-1.5 text-[13px] leading-relaxed opacity-90">"{lastDecisionText}"</p>;
  if (item.status === 'pending') {
    if (isApprover) return null;
    return (
      <Banner tone="border-sky-100 bg-sky-50 text-sky-900" icon={<Clock3 className="h-4 w-4 text-sky-600" />} title={`ממתין להחלטה של ${approverName}`}>
        <p className="mt-1 text-[13px] text-sky-800/80">{isDesigner ? 'ברגע שתהיה החלטה, תגיע אליך התראה.' : `גרסה ${item.versions.length} נשלחה לאישור.`}</p>
      </Banner>
    );
  }
  if (item.status === 'changes') {
    return (
      <Banner tone="border-amber-200 bg-amber-50 text-amber-950" icon={<Wrench className="h-4 w-4 text-amber-600" />} title={isDesigner ? `התקבלו הערות מ${approverName}` : `הוחזר ל${firstName(designerName)} לתיקונים`} testId="changes-banner">
        {quote}
        {isDesigner && (
          <Button variant="primary" block className="mt-3" icon={<Upload className="h-4 w-4" />} onClick={onNewVersion} data-testid="upload-version-btn">
            העלאת גרסה {item.versions.length + 1}
          </Button>
        )}
      </Banner>
    );
  }
  if (item.status === 'approved') {
    return (
      <Banner
        tone="border-emerald-100 bg-emerald-50 text-emerald-950"
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        title={`אושר${lastDecisionAt ? ` ב-${formatDate(lastDecisionAt)}` : ''} · ${approverName}`}
      >
        {quote}
        <Link to="/archive" className="mt-2 inline-block text-[13px] font-semibold text-emerald-700 hover:underline">
          נשמר בארכיון עם כל הגרסאות ←
        </Link>
      </Banner>
    );
  }
  return (
    <Banner tone="border-rose-100 bg-rose-50 text-rose-950" icon={<XCircle className="h-4 w-4 text-rose-600" />} title={`נדחה · ${approverName}`}>
      {quote}
    </Banner>
  );
}

function Banner({ tone, icon, title, children, testId }: { tone: string; icon: React.ReactNode; title: string; children?: React.ReactNode; testId?: string }) {
  return (
    <div className={`border-b px-4 py-3.5 ${tone}`} data-testid={testId}>
      <div className="flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
