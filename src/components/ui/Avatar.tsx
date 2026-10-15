import type { User } from '../../types';

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-[11px]',
  lg: 'h-9 w-9 text-xs',
};

export function Avatar({ user, size = 'md', ring = false }: { user: User; size?: keyof typeof SIZES; ring?: boolean }) {
  return (
    <span
      title={user.name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ${ring ? 'ring-2 ring-white' : ''} ${SIZES[size]}`}
      style={{ backgroundColor: user.color }}
    >
      {user.avatar}
    </span>
  );
}
