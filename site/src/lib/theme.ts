import { useCallback, useEffect, useState } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';
const KEY = 'ta-theme';

const apply = (pref: ThemePref) => {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
};

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>('system');

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (saved === 'light' || saved === 'dark') setPref(saved);
  }, []);

  useEffect(() => {
    apply(pref);
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  const set = useCallback((next: ThemePref) => {
    setPref(next);
    try {
      if (next === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
  }, []);

  return [pref, set] as const;
}
