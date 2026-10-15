import type { ReactNode } from 'react';

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-stone-300 bg-white/50 px-6 py-12 text-center">
      {icon && <span className="mb-4">{icon}</span>}
      <h3 className="text-base font-medium">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-stone-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
