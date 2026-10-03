import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { en, type Dict } from '@/i18n/en';
import { es } from '@/i18n/es';
import { localizedPath } from '@/lib/router';
import { url } from '@/lib/site';

export type Lang = 'en' | 'es';
export const LANGS: Lang[] = ['en', 'es'];
const DICTS: Record<Lang, Dict> = { en, es };

export const dict = (lang: Lang) => DICTS[lang];

type Ctx = { lang: Lang; t: Dict; url: (path: string) => string };
const I18n = createContext<Ctx>({ lang: 'en', t: en, url });

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, t: DICTS[lang], url: (path = '/') => url(localizedPath(path, lang)) }), [lang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);
