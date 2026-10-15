import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Download, Search, SearchX, X } from 'lucide-react';
import type { Item } from '../types';
import { useLookups, useStore } from '../store/StoreProvider';
import { decidedAt } from '../lib/items';
import { formatDate } from '../lib/dates';
import { downloadSource } from '../lib/download';
import { demoItem } from '../lib/tour';
import { works } from '../lib/copy';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { FileThumb } from '../components/ui/FileThumb';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Metrics, Page, PageHeader } from './DashboardPage';

const PERIODS = [
  { value: 'all', label: 'כל התאריכים', days: Infinity },
  { value: '7', label: 'אושרו השבוע', days: 7 },
  { value: '30', label: 'אושרו ב-30 יום', days: 30 },
  { value: '90', label: 'אושרו ב-3 חודשים', days: 90 },
];

export function ArchivePage() {
  const { state, update } = useStore();
  const lookups = useLookups();
  const [q, setQ] = useState('');
  const [designerId, setDesignerId] = useState('all');
  const [period, setPeriod] = useState('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // צעד 5 במדריך ההדגמה
  const demo = demoItem(state);
  useEffect(() => {
    if (demo?.status === 'approved' && !state.tour.archiveSeen) update((s) => ({ ...s, tour: { ...s.tour, archiveSeen: true } }));
  }, [demo?.status, state.tour.archiveSeen, update]);

  const approved = useMemo(() => state.items.filter((i) => i.status === 'approved'), [state.items]);

  const filtered = useMemo(() => {
    const days = PERIODS.find((p) => p.value === period)!.days;
    const since = Date.now() - days * 24 * 3600_000;
    const needle = q.trim();
    return approved
      .filter((i) => designerId === 'all' || i.designerId === designerId)
      .filter((i) => days === Infinity || new Date(decidedAt(i)).getTime() >= since)
      .filter((i) => {
        if (!needle) return true;
        const hay = [
          i.title,
          lookups.projectById.get(i.projectId)?.name,
          lookups.userById.get(i.designerId)?.name,
          lookups.userById.get(i.approverId)?.name,
          formatDate(decidedAt(i)),
          ...i.versions.map((v) => v.sourceFileName ?? ''),
        ].join(' ');
        return hay.includes(needle);
      })
      .sort((a, b) => decidedAt(b).localeCompare(decidedAt(a)));
  }, [approved, q, designerId, period, lookups]);

  const groups = state.projects.map((p) => ({ project: p, items: filtered.filter((i) => i.projectId === p.id) })).filter((g) => g.items.length > 0);
  const designers = state.users.filter((u) => u.role === 'designer');
  const active = q || designerId !== 'all' || period !== 'all';
  const stats = [
    { label: 'עבודות מאושרות', value: approved.length },
    { label: 'פרויקטים', value: new Set(approved.map((i) => i.projectId)).size },
    { label: 'גרסאות שמורות', value: approved.reduce((n, i) => n + i.versions.length, 0) },
    { label: 'קבצי מקור', value: approved.filter((i) => i.versions.some((v) => v.sourceFileName)).length },
  ];

  return (
    <Page>
      <PageHeader title="ארכיון" subtitle='כל עבודה שאושרה, עם כל הגרסאות וקובץ המקור. בלי תיקיות על מחשבים אישיים, ובלי "איפה הקובץ הסופי?".' />

      <Metrics items={stats} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי שם, פרויקט, מעצב, תאריך או שם קובץ"
            className="input ps-9"
            data-testid="archive-search"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select value={designerId} onChange={(e) => setDesignerId(e.target.value)} className="input w-auto" aria-label="מעצב">
            <option value="all">כל המעצבים</option>
            {designers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input w-auto" aria-label="מועד האישור">
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {active && (
          <Button
            variant="ghost"
            icon={<X className="h-4 w-4" />}
            onClick={() => {
              setQ('');
              setDesignerId('all');
              setPeriod('all');
            }}
          >
            ניקוי
          </Button>
        )}
      </div>

      {active && <p className="-mt-2 text-sm text-stone-500">נמצאו {works(filtered.length)}</p>}

      {groups.length === 0 ? (
        <EmptyState icon={<SearchX className="h-6 w-6" strokeWidth={1.5} />} title="לא נמצאו עבודות" text="נסו מילת חיפוש אחרת, או נקו את הסינון." />
      ) : (
        <div className="space-y-10">
          {groups.map(({ project, items }) => {
            const isCollapsed = collapsed[project.id];
            return (
              <section key={project.id} data-testid="archive-group">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [project.id]: !c[project.id] }))}
                  className="group mb-4 flex w-full items-center gap-2.5 border-b border-stone-200/80 pb-3 text-start"
                  aria-expanded={!isCollapsed}
                >
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: project.color }} />
                  <span className="text-base font-semibold text-ink">{project.name}</span>
                  <span className="num text-sm text-stone-400">{items.length}</span>
                  <span className="ms-auto flex -space-x-1.5 space-x-reverse">
                    {[...new Set(items.map((i) => i.designerId))].map((id) => {
                      const u = lookups.userById.get(id);
                      return u ? <Avatar key={id} user={u} size="sm" ring /> : null;
                    })}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-stone-400 transition group-hover:text-ink ${isCollapsed ? 'rotate-90' : ''}`} />
                </button>
                {!isCollapsed && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 xl:grid-cols-4">
                    {items.map((i) => (
                      <ArchiveCard key={i.id} item={i} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Page>
  );
}

function ArchiveCard({ item }: { item: Item }) {
  const { userById } = useLookups();
  const toast = useToast();
  const designer = userById.get(item.designerId);
  const latest = item.versions[item.versions.length - 1];
  const withSource = [...item.versions].reverse().find((v) => v.sourceFileName);
  return (
    <div className="group flex flex-col" data-testid="archive-card">
      <Link to={`/item/${item.id}`} className="relative block overflow-hidden rounded-lg border border-stone-200/80 bg-stone-100/70 transition group-hover:border-stone-300">
        <FileThumb version={latest} className="aspect-[4/3] p-4" />
        <span className="absolute start-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-xs text-stone-600 shadow-xs" title="גרסאות שמורות">
          {item.versions.length === 1 ? 'גרסה 1' : `${item.versions.length} גרסאות`}
        </span>
      </Link>
      <div className="px-0.5 pt-2.5">
        <Link to={`/item/${item.id}`} className="block truncate text-base font-medium text-ink hover:underline hover:decoration-stone-300 hover:underline-offset-4">
          {item.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-500">
          <span className="truncate">{designer?.name}</span>
          <span className="text-stone-300">·</span>
          <span className="shrink-0">{formatDate(decidedAt(item))}</span>
        </div>
        {withSource ? (
          <button
            onClick={() => {
              void downloadSource(withSource);
              toast(`ההורדה של ${withSource.sourceFileName} התחילה`, { tone: 'info' });
            }}
            className="mt-2 flex max-w-full items-center gap-1.5 text-sm text-stone-600 transition hover:text-ink"
            title={withSource.sourceFileName}
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-sm" dir="ltr">
              {withSource.sourceFileName}
            </span>
          </button>
        ) : (
          <div className="mt-2 text-sm text-stone-400">ללא קובץ מקור</div>
        )}
      </div>
    </div>
  );
}
