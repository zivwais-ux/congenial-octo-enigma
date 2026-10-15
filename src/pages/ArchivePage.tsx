import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Download, FolderOpen, Layers, SearchX } from 'lucide-react';
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
import { Search, X } from 'lucide-react';

const PERIODS = [
  { value: 'all', label: 'מכל הזמנים', days: Infinity },
  { value: '7', label: 'בשבוע האחרון', days: 7 },
  { value: '30', label: 'ב-30 הימים האחרונים', days: 30 },
  { value: '90', label: 'ב-3 החודשים האחרונים', days: 90 },
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
    <div className="anim-rise mx-auto max-w-[88rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-zinc-900 sm:text-3xl">ארכיון</h1>
          <p className="mt-1.5 max-w-xl text-[15px] text-zinc-500">כל עבודה שאושרה, עם כל הגרסאות וקובץ המקור. בלי תיקיות על מחשבים אישיים, ובלי לשאול "איפה הקובץ הסופי?".</p>
        </div>
        <dl className="grid grid-cols-4 divide-x divide-x-reverse divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-card">
          {stats.map((s) => (
            <div key={s.label} className="px-3 py-2.5 text-center sm:px-5">
              <dt className="text-[11px] leading-tight text-zinc-500">{s.label}</dt>
              <dd className="mt-0.5 text-lg font-bold text-zinc-900">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי שם, פרויקט, מעצב, תאריך או שם קובץ"
            className="input h-10 py-0 ps-9"
            data-testid="archive-search"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select value={designerId} onChange={(e) => setDesignerId(e.target.value)} className="input h-10 w-auto py-0" aria-label="מעצב">
            <option value="all">כל המעצבים</option>
            {designers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input h-10 w-auto py-0" aria-label="מועד האישור">
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                אושרו {p.label}
              </option>
            ))}
          </select>
        </div>
        {active && (
          <button
            onClick={() => {
              setQ('');
              setDesignerId('all');
              setPeriod('all');
            }}
            className="flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-[13px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
            ניקוי
          </button>
        )}
      </div>

      {active && <p className="mt-3 text-[13px] text-zinc-500">נמצאו {works(filtered.length)}</p>}

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<SearchX className="h-6 w-6" />} title="לא נמצאו עבודות" text="נסו מילת חיפוש אחרת, או נקו את הסינון." />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {groups.map(({ project, items }) => {
            const isCollapsed = collapsed[project.id];
            return (
              <section key={project.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card" data-testid="archive-group">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [project.id]: !c[project.id] }))}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition hover:bg-zinc-50/70 sm:px-5"
                  aria-expanded={!isCollapsed}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${project.color}14`, color: project.color }}>
                    <FolderOpen className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-zinc-900">{project.name}</span>
                    <span className="block text-xs text-zinc-500">{items.length === 1 ? 'עבודה מאושרת אחת' : `${items.length} עבודות מאושרות`}</span>
                  </span>
                  <span className="hidden -space-x-1.5 space-x-reverse sm:flex">
                    {[...new Set(items.map((i) => i.designerId))].map((id) => {
                      const u = lookups.userById.get(id);
                      return u ? <Avatar key={id} user={u} size="sm" /> : null;
                    })}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-zinc-400 transition ${isCollapsed ? 'rotate-90' : ''}`} />
                </button>
                {!isCollapsed && (
                  <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 bg-zinc-50/50 p-3 sm:gap-4 sm:p-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
    </div>
  );
}

function ArchiveCard({ item }: { item: Item }) {
  const { userById } = useLookups();
  const toast = useToast();
  const designer = userById.get(item.designerId);
  const latest = item.versions[item.versions.length - 1];
  const withSource = [...item.versions].reverse().find((v) => v.sourceFileName);
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lift" data-testid="archive-card">
      <Link to={`/item/${item.id}`} className="checker relative block">
        <FileThumb version={latest} className="aspect-[4/3] p-3" />
        <span className="absolute start-2 top-2 flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-900/5" title="גרסאות שמורות">
          <Layers className="h-3 w-3" />
          {item.versions.length}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-zinc-100 p-3">
        <Link to={`/item/${item.id}`} className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 hover:text-brand-700">
          {item.title}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          {designer && <Avatar user={designer} size="xs" ring={false} />}
          <span className="truncate">{designer?.name}</span>
        </div>
        <div className="text-[11px] text-zinc-400">אושר ב-{formatDate(decidedAt(item))}</div>
        <div className="mt-auto pt-2">
          {withSource ? (
            <button
              onClick={() => {
                void downloadSource(withSource);
                toast(`ההורדה של ${withSource.sourceFileName} התחילה`, { tone: 'info' });
              }}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              title={withSource.sourceFileName}
            >
              <Download className="h-3.5 w-3.5" />
              קובץ מקור
              <span className="max-w-[5rem] truncate font-normal text-zinc-400" dir="ltr">
                .{withSource.sourceFileName?.split('.').pop()}
              </span>
            </button>
          ) : (
            <div className="flex h-8 items-center justify-center text-[11px] text-zinc-400">ללא קובץ מקור</div>
          )}
        </div>
      </div>
    </div>
  );
}
