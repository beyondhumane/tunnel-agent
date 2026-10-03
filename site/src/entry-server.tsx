import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { Site } from './App';
import { DOCS } from './lib/docs';
import { docPath, parseRoute, routePath } from './lib/router';
import type { Route } from './lib/router';
import { pageMeta, SEO } from './lib/seo';
import { abs, LICENSE_URL, RELEASES_URL, REPO_URL, SITE_URL, url, VERSION } from './lib/site';

export { DOCS, SEO, SITE_URL, REPO_URL, RELEASES_URL, VERSION, docPath, url, abs };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function jsonLd(route: Route, canonical: string, description: string) {
  if (route.view === 'home') {
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Tunnel Agent',
          description,
          url: canonical,
          image: abs('/og.png'),
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Windows, macOS, Linux',
          softwareVersion: VERSION,
          license: LICENSE_URL,
          downloadUrl: `${RELEASES_URL}/latest`,
          softwareHelp: { '@type': 'CreativeWork', url: abs(docPath()) },
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        { '@type': 'SoftwareSourceCode', name: 'Tunnel Agent', codeRepository: REPO_URL, programmingLanguage: 'C#', license: LICENSE_URL },
      ],
    };
  }
  if (route.view === 'docs') {
    const page = DOCS.find((p) => p.slug === route.slug)!;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'TechArticle', headline: page.title, description, url: canonical, about: { '@type': 'SoftwareApplication', name: 'Tunnel Agent' } },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Tunnel Agent', item: abs('/') },
            { '@type': 'ListItem', position: 2, name: 'Docs', item: abs(docPath()) },
            { '@type': 'ListItem', position: 3, name: page.title, item: canonical },
          ],
        },
      ],
    };
  }
  return null;
}

function head(route: Route): string {
  const { title, description } = pageMeta(route);
  const tags = [`<title>${esc(title)}</title>`, `<meta name="description" content="${esc(description)}" />`];
  if (route.view === 'missing') {
    tags.push('<meta name="robots" content="noindex" />');
    return tags.join('\n    ');
  }
  const canonical = abs(routePath(route));
  const image = abs('/og.png');
  tags.push(
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="${route.view === 'docs' ? 'article' : 'website'}" />`,
    '<meta property="og:site_name" content="Tunnel Agent" />',
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:image" content="${image}" />`,
  );
  const ld = jsonLd(route, canonical, description);
  if (ld) tags.push(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
  return tags.join('\n    ');
}

/** `path` is app-relative ("/docs/agents/"); the rendered markup links with the base prefix. */
export function render(path: string): { html: string; head: string } {
  const full = url(path);
  const html = renderToString(
    <StrictMode>
      <Site path={full} />
    </StrictMode>,
  );
  return { html, head: head(parseRoute(full)) };
}

export function paths(): string[] {
  return ['/', '/docs/', ...DOCS.map((p) => docPath(p.slug))];
}
