import { docsFor } from '@/lib/docs';
import { dict, LANGS, type Lang } from '@/lib/i18n';
import { routePath, type Route } from '@/lib/router';
import { abs, LICENSE_URL, RELEASES_URL, REPO_URL, VERSION } from '@/lib/site';

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

export function pageData(route: Route, lang: Lang) {
  const { title, description } = pageMeta(route, lang);
  const canonical = abs(routePath(route, lang));
  const alternates = [...LANGS.map((l) => ({ lang: l as string, href: abs(routePath(route, l)) })), { lang: 'x-default', href: abs(routePath(route)) }];
  const meta = [
    { name: 'description', content: description },
    { name: 'robots', content: route.view === 'missing' ? 'noindex' : 'index, follow' },
    { property: 'og:type', content: route.view === 'docs' ? 'article' : 'website' },
    { property: 'og:site_name', content: 'Tunnel Agent' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: lang === 'es' ? 'es_ES' : 'en_US' },
    { property: 'og:image', content: abs('/og.png') },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: abs('/og.png') },
  ];
  const graph: object[] = [];
  if (route.view === 'home') {
    graph.push(
      { '@type': 'SoftwareApplication', name: 'Tunnel Agent', description, url: canonical, image: abs('/og.png'), applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux', softwareVersion: VERSION, license: LICENSE_URL, downloadUrl: `${RELEASES_URL}/latest`, softwareHelp: { '@type': 'CreativeWork', url: abs(routePath({ view: 'docs', slug: 'introduction' }, lang)) }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      { '@type': 'SoftwareSourceCode', name: 'Tunnel Agent', codeRepository: REPO_URL, programmingLanguage: 'C#', license: LICENSE_URL },
      { '@type': 'FAQPage', inLanguage: lang, mainEntity: dict(lang).faq.items.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) },
    );
  } else if (route.view === 'docs') {
    const page = docsFor(lang).find((p) => p.slug === route.slug)!;
    graph.push(
      { '@type': 'TechArticle', headline: page.title, description, url: canonical, inLanguage: lang, about: { '@type': 'SoftwareApplication', name: 'Tunnel Agent' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Tunnel Agent', item: abs(routePath({ view: 'home' }, lang)) },
        { '@type': 'ListItem', position: 2, name: dict(lang).docs.docs, item: abs(routePath({ view: 'docs', slug: 'introduction' }, lang)) },
        { '@type': 'ListItem', position: 3, name: page.title, item: canonical },
      ] },
    );
  }
  return { title, canonical, alternates, meta, ld: graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null };
}
