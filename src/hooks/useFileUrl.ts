import { useEffect, useState } from 'react';
import { resolveFileUrl, resolveFileUrlSync } from '../store/fileStore';

/** מחזיר URL לתצוגה עבור previewFileUrl (data: או idb://) */
export function useFileUrl(ref: string | undefined) {
  const [url, setUrl] = useState<string | undefined>(() => (ref ? resolveFileUrlSync(ref) : undefined));
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setMissing(false);
    if (!ref) {
      setUrl(undefined);
      return;
    }
    const sync = resolveFileUrlSync(ref);
    if (sync) {
      setUrl(sync);
      return;
    }
    setUrl(undefined);
    resolveFileUrl(ref).then((u) => {
      if (!alive) return;
      setUrl(u);
      setMissing(!u);
    });
    return () => {
      alive = false;
    };
  }, [ref]);

  return { url, missing };
}
