import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { Site } from './App';
import { DOCS, docsFor } from './lib/docs';
import { dict, LANGS } from './lib/i18n';
import { docPath, langFromPath, localizedPath, parseRoute } from './lib/router';
import { pageData, SEO } from './lib/seo';
import { abs, RELEASES_URL, REPO_URL, SITE_URL, url, VERSION } from './lib/site';

export { DOCS, docsFor, dict, LANGS, SEO, SITE_URL, REPO_URL, RELEASES_URL, VERSION, docPath, localizedPath, url, abs };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** `path` is app-relative; the rendered markup links with the base prefix. */
export function render(path: string) {
  const full = url(path);
  const lang = langFromPath(full);
  const route = parseRoute(full);
  const data = pageData(route, lang);
  const tags = [
    '<title>' + esc(data.title) + '</title>',
    ...data.meta.map((attrs) => '<meta data-page-seo ' + Object.entries(attrs).map(([key, value]) => key + '="' + esc(value) + '"').join(' ') + ' />'),
  ];
  if (route.view !== 'missing') {
    tags.push('<link data-page-seo rel="canonical" href="' + esc(data.canonical) + '" />');
    tags.push(...data.alternates.map((a) => '<link data-page-seo rel="alternate" hreflang="' + a.lang + '" href="' + esc(a.href) + '" />'));
  }
  if (data.ld) tags.push('<script data-page-seo type="application/ld+json">' + JSON.stringify(data.ld).replace(/</g, '\\u003c') + '</script>');
  const html = renderToString(<StrictMode><Site path={full} /></StrictMode>);
  return { html, lang, head: tags.join('\n    ') };
}

export function paths(): string[] {
  return LANGS.flatMap((lang) => ['/', '/docs/', ...docsFor(lang).map((p) => docPath(p.slug))].map((path) => localizedPath(path, lang)));
}
