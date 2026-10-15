import type { Project } from '../../types';

/** שם פרויקט עם גוון עדין של צבע הפרויקט */
export function ProjectChip({ project, size = 'sm' }: { project?: Project; size?: 'sm' | 'xs' }) {
  if (!project) return null;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-md font-medium text-stone-700 ${size === 'xs' ? 'h-5 px-1.5 text-xs' : 'h-6 px-2 text-sm'}`}
      style={{ backgroundColor: `${project.color}14`, boxShadow: `inset 0 0 0 1px ${project.color}22` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
      <span className="truncate">{project.name}</span>
    </span>
  );
}
