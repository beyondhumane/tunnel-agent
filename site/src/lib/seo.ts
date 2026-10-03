import { docsFor } from '@/lib/docs';
import { dict, type Lang } from '@/lib/i18n';
import type { Route } from '@/lib/router';

export const SEO = dict('en').seo;

export function pageMeta(route: Route, lang: Lang = 'en'): { title: string; description: string } {
  const seo = dict(lang).seo;
  if (route.view === 'home') return { title: seo.home, description: seo.description };
  if (route.view === 'docs') {
    const page = docsFor(lang).find((p) => p.slug === route.slug);
    if (page) return { title: `${page.title} · ${seo.docs}`, description: page.description };
  }
  return { title: seo.missing, description: seo.missingDesc };
}
