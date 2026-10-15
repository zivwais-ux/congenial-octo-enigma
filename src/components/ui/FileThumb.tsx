import { FileText, ImageOff } from 'lucide-react';
import type { Version } from '../../types';
import { useFileUrl } from '../../hooks/useFileUrl';

export function isPdf(v: Pick<Version, 'previewMime' | 'previewFileName'>) {
  return v.previewMime === 'application/pdf' || v.previewFileName.toLowerCase().endsWith('.pdf');
}

/** תמונה ממוזערת של גרסה – תמונה, או אייקון עבור PDF */
export function FileThumb({ version, className = '' }: { version: Version; className?: string }) {
  const { url, missing } = useFileUrl(version.previewFileUrl);
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-slate-100 ${className}`}>
      {isPdf(version) ? (
        <div className="flex flex-col items-center gap-1 text-slate-400">
          <FileText className="h-8 w-8" />
          <span className="text-[11px] font-semibold">PDF</span>
        </div>
      ) : url ? (
        <img src={url} alt="" className="h-full w-full object-contain" loading="lazy" draggable={false} />
      ) : missing ? (
        <ImageOff className="h-6 w-6 text-slate-300" />
      ) : null}
    </div>
  );
}
