import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-stone-800 active:bg-black',
  secondary: 'border border-stone-300/80 bg-white text-ink shadow-xs hover:border-stone-400/80 hover:bg-stone-50',
  ghost: 'text-stone-600 hover:bg-stone-100 hover:text-ink',
  approve: 'bg-[#1f7a4d] text-white hover:bg-[#1a6942]',
  danger: 'border border-stone-300/80 bg-white text-red-700 shadow-xs hover:border-red-300 hover:bg-red-50',
  'danger-solid': 'bg-red-700 text-white hover:bg-red-800',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-md px-2.5 text-sm',
  md: 'h-9 gap-2 rounded-md px-3.5 text-base',
  lg: 'h-11 gap-2 rounded-lg px-4 text-base',
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
      className={`inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${
        block ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});
