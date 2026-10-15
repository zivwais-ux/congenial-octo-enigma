import type { Version } from '../types';
import { getBlob } from '../store/fileStore';

function trigger(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** הורדת קובץ המקור. אם הועלה קובץ אמיתי – מורידים אותו; בנתוני הדמה – קובץ דמה באותו שם */
export async function downloadSource(v: Version) {
  if (!v.sourceFileName) return;
  const real = v.sourceFileUrl ? await getBlob(v.sourceFileUrl) : undefined;
  if (real) return trigger(real, v.sourceFileName);
  trigger(
    new Blob([`קובץ דמה עבור ${v.sourceFileName}\nבמערכת האמיתית כאן יירד קובץ המקור המלא.\n`], { type: 'text/plain;charset=utf-8' }),
    v.sourceFileName,
  );
}
