import { FileText, ImageOff } from 'lucide-react';
import type { Version } from '../../types';
import { useFileUrl } from '../../hooks/useFileUrl';

export function isPdf(v: Pick<Version, 'previewMime' | 'previewFileName'>) {
  return v.previewMime === 'application/pdf' || v.previewFileName.toLowerCase().endsWith('.pdf');
}

/** תמונה ממוזערת של גרסה – תמונה, או סמל עבור PDF */
export function FileThumb({ version, className = '', fit = 'contain' }: { version: Version; className?: string; fit?: 'contain' | 'cover' }) {
  const { url, missing } = useFileUrl(version.previewFileUrl);
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      {isPdf(version) ? (
        <div className="flex flex-col items-center gap-1 text-zinc-400">
          <FileText className="h-8 w-8" strokeWidth={1.5} />
          <span className="text-[10px] font-bold tracking-wider">PDF</span>
        </div>
      ) : url ? (
        <img
          src={url}
          alt=""
          className={`h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.08)]'}`}
          loading="lazy"
          draggable={false}
        />
      ) : missing ? (
        <ImageOff className="h-6 w-6 text-zinc-300" />
      ) : null}
    </div>
  );
}
