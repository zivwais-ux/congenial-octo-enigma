// שמירת קבצים שהועלו בדמו ב-IndexedDB, כדי שתצוגה מקדימה תעבוד גם אחרי רענון.
// ב-state נשמרת רק הפניה בצורת idb://<id>.

const DB_NAME = 'gadot-approvals-files';
const STORE = 'files';
export const IDB_PREFIX = 'idb://';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        t.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        t.onerror = () => {
          db.close();
          reject(t.error);
        };
      }),
  );
}

const cache = new Map<string, string>();

/** שומר קובץ ומחזיר הפניה idb://… ; אם IndexedDB לא זמין – object URL לזמן הסשן */
export async function saveFile(file: Blob): Promise<string> {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const ref = IDB_PREFIX + id;
  cache.set(ref, URL.createObjectURL(file));
  try {
    await tx('readwrite', (s) => s.put(file, id));
    return ref;
  } catch {
    return cache.get(ref)!;
  }
}

export async function getBlob(ref: string): Promise<Blob | undefined> {
  if (!ref.startsWith(IDB_PREFIX)) return undefined;
  try {
    return await tx<Blob | undefined>('readonly', (s) => s.get(ref.slice(IDB_PREFIX.length)));
  } catch {
    return undefined;
  }
}

/** ממיר הפניה ל-URL שאפשר לשים ב-img/iframe */
export async function resolveFileUrl(ref: string): Promise<string | undefined> {
  if (!ref.startsWith(IDB_PREFIX)) return ref;
  const cached = cache.get(ref);
  if (cached) return cached;
  const blob = await getBlob(ref);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  cache.set(ref, url);
  return url;
}

export function resolveFileUrlSync(ref: string): string | undefined {
  return ref.startsWith(IDB_PREFIX) ? cache.get(ref) : ref;
}

export async function clearFiles() {
  cache.forEach((url) => URL.revokeObjectURL(url));
  cache.clear();
  try {
    await tx('readwrite', (s) => s.clear());
  } catch {
    // לא קריטי לדמו
  }
}
