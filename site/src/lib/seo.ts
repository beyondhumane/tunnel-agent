import { DOCS } from '@/lib/docs';
import type { Route } from '@/lib/router';

export const SEO = {
  home: 'Tunnel Agent · One local endpoint for every AI subscription',
  description:
    'Tunnel Agent is a free, open-source desktop app for CLIProxyAPI, Perplexity WebUI Scraper and 9Router. Connect Claude, Codex, Gemini and more, then point any coding agent at localhost.',
  docs: 'Tunnel Agent Docs',
};

export function pageMeta(route: Route): { title: string; description: string } {
  if (route.view === 'home') return { title: SEO.home, description: SEO.description };
  if (route.view === 'docs') {
    const page = DOCS.find((p) => p.slug === route.slug);
    if (page) return { title: `${page.title} · ${SEO.docs}`, description: page.description };
  }
  return { title: 'Page not found · Tunnel Agent', description: 'This page does not exist.' };
}
