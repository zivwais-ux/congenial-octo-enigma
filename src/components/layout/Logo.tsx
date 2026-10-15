import { Link } from 'react-router-dom';

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="7" fill="#1c1917" />
      <rect x="18" y="8" width="6" height="6" rx="1" fill="#f45a16" />
      <path d="M8 22h16" stroke="#fafaf9" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md" aria-label="גדות סטודיו, לדף הראשי">
      <LogoMark />
      <span className="text-[15px] leading-none">
        <span className="font-semibold text-ink">גדות</span>
        <span className="ms-1 font-normal text-stone-400">סטודיו</span>
      </span>
    </Link>
  );
}
