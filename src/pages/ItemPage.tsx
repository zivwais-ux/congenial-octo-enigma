import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Columns2, Download, Upload, Wrench, XCircle } from 'lucide-react';
import type { Item, Pin, Status } from '../types';
import { useLookups, useStore } from '../store/StoreProvider';
import { addComment, decide, toggleResolved } from '../store/actions';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DueLabel } from '../components/ui/DueLabel';
import { PreviewPane, type NumberedPin } from '../components/viewer/PreviewPane';
import { CommentPanel } from '../components/viewer/CommentPanel';
import { Timeline } from '../components/viewer/Timeline';
import { DecisionBar } from '../components/viewer/DecisionBar';
import { VersionTabs } from '../components/viewer/VersionTabs';
import { CompareView } from '../components/viewer/CompareView';
import { NewVersionModal } from '../components/upload/NewVersionModal';
import { downloadSource } from '../lib/download';
import { formatDateTime } from '../lib/dates';

export function ItemPage() {
  const { id } = useParams();
  const { state } = useStore();
  const item = state.items.find((i) => i.id === id);
  if (!item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">העבודה לא נמצאה</h1>
        <p className="mt-2 text-sm text-slate-500">ייתכן שהדמו אופס.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
          חזרה לדשבורד
        </Link>
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
  const [compare, setCompare] = useState(false);
  const [newVersionOpen, setNewVersionOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // גרסה חדשה עלתה – עוברים אליה
  useEffect(() => {
    setViewId(latest.id);
    setCompare(false);
  }, [latest.id]);

  // פתיחת הפריט מסמנת את ההתראות שלו כנקראו
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
  const olderCount = itemComments.filter((c) => c.versionId !== version.id).length;

  const isApprover = currentUser.id === item.approverId;
  const isDesigner = currentUser.id === item.designerId;
  const open = item.status === 'pending' || item.status === 'changes';
  const canPin = isLatest && open;
  const canDecide = isApprover && item.status === 'pending';
  const lastDecision = [...item.events].reverse().find((e) => e.type === 'decision');

  const onAddPin = (pin: Pin, text: string) => {
    update((s) => addComment(s, item.id, version.id, text, pin));
  };

  const onDecide = (d: Exclude<Status, 'pending'>, text: string) => {
    update((s) => decide(s, item.id, d, text));
    const msg = { approved: `העבודה אושרה. נשלחה התראה ל${designer.name}`, changes: `בקשת התיקונים נשלחה ל${designer.name}`, rejected: `העבודה נדחתה. נשלחה התראה ל${designer.name}` }[d];
    toast(msg);
  };

  const selectFromList = (id: string | null) => {
    setActiveId(id);
    if (id && window.innerWidth < 1024) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 ${canDecide ? 'pb-28 lg:pb-6' : ''}`}>
      {/* כותרת */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{item.title}</h1>
            <StatusBadge status={item.status} size="md" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project?.color }} />
              {project?.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Avatar user={designer} size="xs" />
              {designer.name}
              <span className="text-slate-300">←</span>
              <Avatar user={approver} size="xs" />
              {approver.name}
            </span>
            <DueLabel dueDate={item.dueDate} status={item.status} />
          </div>
        </div>
        {sourceVersion && (
          <button
            onClick={() => {
              void downloadSource(sourceVersion);
              toast(`מוריד את ${sourceVersion.sourceFileName}`, 'info');
            }}
            className="flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 lg:self-auto"
            data-testid="download-source"
          >
            <Download className="h-4 w-4" />
            <span className="max-w-[16rem] truncate" dir="ltr">
              {sourceVersion.sourceFileName}
            </span>
            {sourceVersion.id !== version.id && <span className="text-xs text-slate-400">(מגרסה {sourceVersion.number})</span>}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* תצוגה מקדימה */}
        <div ref={previewRef} className="min-w-0 scroll-mt-20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {compare ? (
              <span className="text-sm font-semibold text-slate-700">השוואת גרסאות</span>
            ) : (
              <VersionTabs
                versions={item.versions}
                value={version.id}
                onChange={(v) => {
                  setViewId(v);
                  setActiveId(null);
                }}
              />
            )}
            <div className="flex items-center gap-2">
              {!isLatest && !compare && (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">צופים בגרסה ישנה</span>
              )}
              {item.versions.length > 1 && (
                <button
                  onClick={() => setCompare((c) => !c)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition ${
                    compare ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  data-testid="compare-toggle"
                >
                  <Columns2 className="h-4 w-4" />
                  {compare ? 'סגירת השוואה' : 'השוואה'}
                </button>
              )}
            </div>
          </div>
          {compare ? (
            <CompareView item={item} comments={itemComments} />
          ) : (
            <>
              <PreviewPane
                version={version}
                pins={pinned}
                activeId={activeId}
                onSelect={setActiveId}
                onAddPin={canPin ? onAddPin : undefined}
                showResolved={showResolved}
              />
              {version.note && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                    <Avatar user={designer} size="xs" />
                    {designer.name} · הערה לגרסה {version.number} · {formatDateTime(version.uploadedAt)}
                  </div>
                  <p className="text-slate-700">{version.note}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* פאנל צד */}
        <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white lg:sticky lg:top-20 lg:h-[calc(100vh-6.5rem)]">
          {canDecide && <DecisionBar onDecide={onDecide} openPinCount={openPins} designerName={designer.name} />}
          <StatusBanner
            item={item}
            isDesigner={isDesigner}
            isApprover={isApprover}
            lastDecisionText={lastDecision?.text}
            approverName={approver.name}
            onNewVersion={() => setNewVersionOpen(true)}
          />

          <div className="flex border-b border-slate-200 px-2" role="tablist">
            <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')}>
              הערות
              <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">{versionComments.filter((c) => !c.resolved).length}</span>
            </TabBtn>
            <TabBtn active={tab === 'timeline'} onClick={() => setTab('timeline')}>
              ציר זמן
            </TabBtn>
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
            <div className="flex-1 overflow-y-auto">
              <Timeline item={item} />
            </div>
          )}
        </aside>
      </div>
      {isDesigner && <NewVersionModal item={item} open={newVersionOpen} onClose={() => setNewVersionOpen(false)} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium ${
        active ? 'border-brand-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
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
  approverName,
  onNewVersion,
}: {
  item: Item;
  isDesigner: boolean;
  isApprover: boolean;
  lastDecisionText?: string;
  approverName: string;
  onNewVersion: () => void;
}) {
  if (item.status === 'pending') {
    if (isApprover) return null;
    return (
      <div className="border-b border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        ממתין להחלטה של {approverName}
      </div>
    );
  }
  if (item.status === 'changes') {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3" data-testid="changes-banner">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <Wrench className="h-4 w-4" />
          נדרשים תיקונים · {approverName}
        </div>
        {lastDecisionText && <p className="mt-1 text-sm text-amber-900/80">"{lastDecisionText}"</p>}
        {isDesigner && (
          <button
            onClick={onNewVersion}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            data-testid="upload-version-btn"
          >
            <Upload className="h-4 w-4" />
            העלה גרסה חדשה
          </button>
        )}
      </div>
    );
  }
  if (item.status === 'approved') {
    return (
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          אושר ע״י {approverName} · נשמר בארכיון
        </div>
        {lastDecisionText && <p className="mt-1 text-emerald-800/80">"{lastDecisionText}"</p>}
      </div>
    );
  }
  return (
    <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <div className="flex items-center gap-2 font-semibold">
        <XCircle className="h-4 w-4" />
        נדחה ע״י {approverName}
      </div>
      {lastDecisionText && <p className="mt-1 text-rose-800/80">"{lastDecisionText}"</p>}
    </div>
  );
}
