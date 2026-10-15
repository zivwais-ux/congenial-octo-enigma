import type { Status } from '../../types';
import { STATUS_META } from '../../lib/status';

export function StatusBadge({ status, size = 'sm' }: { status: Status; size?: 'sm' | 'md' }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium ${m.badge} ${size === 'md' ? 'h-6 pe-2.5 ps-2 text-sm' : 'h-[22px] pe-2 ps-1.5 text-xs'}`}>
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} strokeWidth={2.25} />
      {m.label}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />;
}
