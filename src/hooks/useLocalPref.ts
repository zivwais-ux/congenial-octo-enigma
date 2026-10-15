import { useState } from 'react';

/** העדפה קטנה של הצופה (למשל תצוגת רשת/רשימה), נשמרת בדפדפן */
export function useLocalPref<T extends string>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T) || fallback;
    } catch {
      return fallback;
    }
  });
  const set = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, v);
    } catch {
      // לא קריטי
    }
  };
  return [value, set] as const;
}
