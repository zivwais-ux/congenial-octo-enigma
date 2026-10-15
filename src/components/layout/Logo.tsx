import { useId } from 'react';
import { Link } from 'react-router-dom';

export function LogoMark({ size = 32 }: { size?: number }) {
  // מזהה ייחודי לכל מופע, אחרת הגרדיאנט נעלם כשמופע אחר מוסתר
  const id = `logo${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7f87f6" />
          <stop offset="1" stopColor="#3f3cc4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <path d="M9.5 16.5l4.2 4.2L22.5 11.8" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="סטודיו גדות, לסקירה">
      <LogoMark size={compact ? 28 : 32} />
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight text-zinc-900">סטודיו גדות</span>
        {!compact && <span className="block text-[11px] text-zinc-500">אישור עבודות גרפיות</span>}
      </span>
    </Link>
  );
}
