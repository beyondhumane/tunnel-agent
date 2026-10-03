import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type Dict } from '@/i18n/en';
import { es } from '@/i18n/es';

export type Lang = 'en' | 'es';
export const LANGS: Lang[] = ['en', 'es'];
const DICTS: Record<Lang, Dict> = { en, es };
const KEY = 'ta-lang';

const isLang = (v: unknown): v is Lang => v === 'en' || v === 'es';

/** Saved choice first, then the browser's preferred languages, then English. */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {}
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const p of prefs) {
    const base = p?.toLowerCase().split('-')[0];
    if (isLang(base)) return base;
  }
  return 'en';
}

export const dict = (lang: Lang) => DICTS[lang];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Dict };
const I18n = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: en });

export function I18nProvider({ lang: initial, children }: { lang: Lang; children: ReactNode }) {
  const [lang, setState] = useState(initial);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang, setLang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);
