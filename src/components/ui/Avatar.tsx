import type { User } from '../../types';

const SIZES = { xs: 'h-5 w-5 text-[9px]', sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' };

export function Avatar({ user, size = 'md' }: { user: User; size?: keyof typeof SIZES }) {
  return (
    <span
      title={user.name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white ${SIZES[size]}`}
      style={{ backgroundColor: user.color }}
    >
      {user.avatar}
    </span>
  );
}
