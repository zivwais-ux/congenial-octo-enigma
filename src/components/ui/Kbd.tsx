import type { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-stone-200 bg-stone-50 px-1 font-mono text-[10px] text-stone-500" dir="ltr">
      {children}
    </kbd>
  );
}
