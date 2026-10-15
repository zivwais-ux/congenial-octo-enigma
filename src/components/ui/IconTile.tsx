import type { LucideIcon } from 'lucide-react';
import { TONE, type Tone } from '../../lib/status';

const SIZES = { sm: 'h-6 w-6 rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5', md: 'h-8 w-8 rounded-lg [&>svg]:h-4 [&>svg]:w-4', lg: 'h-10 w-10 rounded-xl [&>svg]:h-5 [&>svg]:w-5' };

/** אייקון קטן על רקע בגוון עדין */
export function IconTile({ icon: Icon, tone = 'stone', size = 'sm', className = '' }: { icon: LucideIcon; tone?: Tone; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ring-1 ring-inset ${TONE[tone].tile} ${SIZES[size]} ${className}`}>
      <Icon strokeWidth={1.9} />
    </span>
  );
}
