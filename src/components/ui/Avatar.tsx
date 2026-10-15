import type { User } from '../../types';

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-12 w-12 text-base',
};

export function Avatar({ user, size = 'md', ring = true }: { user: User; size?: keyof typeof SIZES; ring?: boolean }) {
  return (
    <span
      title={user.name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight text-white ${ring ? 'ring-2 ring-white' : ''} ${SIZES[size]}`}
      style={{ background: `linear-gradient(135deg, ${user.color}, ${user.color}d0)` }}
    >
      {user.avatar}
    </span>
  );
}
