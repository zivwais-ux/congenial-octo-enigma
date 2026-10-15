import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 active:bg-zinc-950',
  brand: 'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700',
  secondary: 'border border-zinc-200 bg-white text-zinc-800 shadow-sm shadow-zinc-900/[0.03] hover:border-zinc-300 hover:bg-zinc-50',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
  approve: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700',
  changes: 'bg-amber-500 text-white shadow-sm shadow-amber-500/20 hover:bg-amber-600',
  reject: 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700',
  'changes-soft': 'border border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100',
  'reject-soft': 'border border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[15px]',
  icon: 'h-9 w-9 justify-center rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  icon?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, loading, block, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition duration-150 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${
        block ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});
