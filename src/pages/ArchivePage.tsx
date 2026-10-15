import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ChevronDown, Download, Folder, Layers, Search, X } from 'lucide-react';
import type { Item } from '../types';
import { useLookups, useStore } from '../store/StoreProvider';
import { decidedAt } from '../lib/items';
import { formatDate } from '../lib/dates';
import { downloadSource } from '../lib/download';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { FileThumb } from '../components/ui/FileThumb';

const PERIODS = [
  { value: 'all', label: 'כל הזמנים', days: Infinity },
  { value: '7', label: '7 הימים האחרונים', days: 7 },
  { value: '30', label: '30 הימים האחרונים', days: 30 },
  { value: '90', label: '3 החודשים האחרונים', days: 90 },
];

export function ArchivePage() {
  const { state } = useStore();
  const lookups = useLookups();
  const [q, setQ] = useState('');
  const [designerId, setDesignerId] = useState('all');
  const [period, setPeriod] = useState('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
          formatDate(decidedAt(i)),
          ...i.versions.map((v) => v.sourceFileName ?? ''),
        ].join(' ');
        return hay.includes(needle);
      })
      .sort((a, b) => decidedAt(b).localeCompare(decidedAt(a)));
  }, [approved, q, designerId, period, lookups]);

  const groups = state.projects
    .map((p) => ({ project: p, items: filtered.filter((i) => i.projectId === p.id) }))
    .filter((g) => g.items.length > 0);

  const designers = state.users.filter((u) => u.role === 'designer');
  const active = q || designerId !== 'all' || period !== 'all';
  const projectsWithApproved = new Set(approved.map((i) => i.projectId)).size;
  const versionsCount = approved.reduce((n, i) => n + i.versions.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Archive className="h-6 w-6 text-slate-400" />
          ארכיון עבודות מאושרות
        </h1>
        <p className="text-sm text-slate-500">
          {approved.length} עבודות מאושרות ב-{projectsWithApproved} פרויקטים, עם {versionsCount} גרסאות וקבצי המקור. מקום אחד, בלי לחפש בתיקיות.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לפי שם, פרויקט, מעצב, תאריך או שם קובץ"
            className="w-full rounded-lg border border-slate-200 py-2 pe-3 ps-9 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            data-testid="archive-search"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select value={designerId} onChange={(e) => setDesignerId(e.target.value)} className={selectCls} aria-label="מעצב">
            <option value="all">כל המעצבים</option>
            {designers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={selectCls} aria-label="תאריך אישור">
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
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
            className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
            נקה
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-12 text-center text-sm text-slate-500">
          לא נמצאו עבודות מאושרות שתואמות לחיפוש
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map(({ project, items }) => {
            const isCollapsed = collapsed[project.id];
            return (
              <section key={project.id} className="rounded-xl border border-slate-200 bg-white" data-testid="archive-group">
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [project.id]: !c[project.id] }))}
                  className="flex w-full items-center gap-3 px-4 py-3 text-start"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${project.color}15`, color: project.color }}>
                    <Folder className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-900">{project.name}</span>
                    <span className="block text-xs text-slate-500">{items.length === 1 ? 'עבודה מאושרת אחת' : `${items.length} עבודות מאושרות`}</span>
                  </span>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition ${isCollapsed ? 'rotate-90' : ''}`} />
                </button>
                {!isCollapsed && (
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-3 sm:gap-4 sm:p-4 md:grid-cols-3 xl:grid-cols-5">
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

const selectCls =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

function ArchiveCard({ item }: { item: Item }) {
  const { userById } = useLookups();
  const toast = useToast();
  const designer = userById.get(item.designerId);
  const latest = item.versions[item.versions.length - 1];
  const withSource = [...item.versions].reverse().find((v) => v.sourceFileName);
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-md" data-testid="archive-card">
      <Link to={`/item/${item.id}`}>
        <FileThumb version={latest} className="aspect-[4/3] p-2" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <Link to={`/item/${item.id}`} className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 hover:text-brand-700">
          {item.title}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {designer && <Avatar user={designer} size="xs" />}
          <span className="truncate">{designer?.name}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
          <span>אושר {formatDate(decidedAt(item))}</span>
          <span className="flex items-center gap-0.5" title="מספר גרסאות">
            <Layers className="h-3 w-3" />
            {item.versions.length}
          </span>
        </div>
        {withSource && (
          <button
            onClick={() => {
              void downloadSource(withSource);
              toast(`מוריד את ${withSource.sourceFileName}`, 'info');
            }}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            title={withSource.sourceFileName}
          >
            <Download className="h-3.5 w-3.5" />
            קובץ מקור
          </button>
        )}
      </div>
    </div>
  );
}
