import { useEffect, useState } from 'react';

export function useStoredState<T>(key: string, fallback: T, valid: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) || 'null');
      return valid(saved) ? saved : fallback;
    } catch { return fallback; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { window.dispatchEvent(new Event('noir-storage-error')); }
  }, [key, value]);
  return [value, setValue] as const;
}
