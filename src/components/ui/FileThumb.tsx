import { FileText, ImageOff } from 'lucide-react';
import type { Version } from '../../types';
import { useFileUrl } from '../../hooks/useFileUrl';

export function isPdf(v: Pick<Version, 'previewMime' | 'previewFileName'>) {
  return v.previewMime === 'application/pdf' || v.previewFileName.toLowerCase().endsWith('.pdf');
}

/** תמונה ממוזערת של גרסה – תמונה, או סמל עבור PDF */
export function FileThumb({ version, className = '' }: { version: Version; className?: string }) {
  const { url, missing } = useFileUrl(version.previewFileUrl);
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`}>
      {isPdf(version) ? (
        <div className="flex flex-col items-center gap-1 text-stone-400">
          <FileText className="h-7 w-7" strokeWidth={1.25} />
          <span className="font-mono text-[10px]">PDF</span>
        </div>
      ) : url ? (
        <img src={url} alt="" className="h-full w-full object-contain" loading="lazy" draggable={false} />
      ) : missing ? (
        <ImageOff className="h-5 w-5 text-stone-300" strokeWidth={1.5} />
      ) : null}
    </div>
  );
}
