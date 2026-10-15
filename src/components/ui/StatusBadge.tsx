import type { Status } from '../../types';
import { STATUS_META } from '../../lib/status';

export function StatusBadge({ status, size = 'sm' }: { status: Status; size?: 'sm' | 'md' }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded font-medium ${m.badge} ${size === 'md' ? 'h-6 px-2 text-sm' : 'h-5 px-1.5 text-xs'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />;
}
