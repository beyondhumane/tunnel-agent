import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DOCS } from '@/lib/docs';
import { BASE } from '@/lib/site';

export type Route = { view: 'home' } | { view: 'docs'; slug: string } | { view: 'missing' };

export const docPath = (slug = DOCS[0].slug) => `/docs/${slug}/`;

export function routePath(route: Route): string {
  return route.view === 'docs' ? docPath(route.slug) : '/';
}

const strip = (pathname: string) => {
  const b = BASE.replace(/\/$/, '');
  return b && pathname.startsWith(b) ? pathname.slice(b.length) || '/' : pathname;
};

export function parseRoute(pathname: string): Route {
  const parts = strip(pathname).replace(/index\.html$/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { view: 'home' };
  if (parts[0] === 'docs' && parts.length <= 2) {
    const slug = parts[1] ?? DOCS[0].slug;
    if (DOCS.some((p) => p.slug === slug)) return { view: 'docs', slug };
  }
  return { view: 'missing' };
}

const RouterContext = createContext<{ route: Route; hash: string }>({ route: { view: 'home' }, hash: '' });

export function RouterProvider({ path, children }: { path: string; children: ReactNode }) {
  const [loc, setLoc] = useState(() => ({ pathname: path, hash: '' }));

  const navigate = useCallback((u: URL) => {
    const samePage = u.pathname === window.location.pathname;
    if (u.pathname + u.hash !== window.location.pathname + window.location.hash) {
      window.history.pushState(null, '', u.pathname + u.hash);
    }
    setLoc({ pathname: u.pathname, hash: u.hash });
    requestAnimationFrame(() => {
      const el = u.hash ? document.getElementById(decodeURIComponent(u.hash.slice(1))) : null;
      if (el) el.scrollIntoView({ behavior: samePage ? 'smooth' : 'auto' });
      else if (!samePage) window.scrollTo(0, 0);
    });
  }, []);

  useEffect(() => {
    setLoc({ pathname: window.location.pathname, hash: window.location.hash });
    const onPop = () => setLoc({ pathname: window.location.pathname, hash: window.location.hash });
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const u = new URL(a.href, window.location.href);
      if (u.origin !== window.location.origin || /\.[a-z0-9]+$/i.test(u.pathname)) return;
      if (!u.pathname.startsWith(BASE)) return;
      e.preventDefault();
      navigate(u);
    };
    window.addEventListener('popstate', onPop);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
    };
  }, [navigate]);

  const value = useMemo(() => ({ route: parseRoute(loc.pathname), hash: loc.hash }), [loc]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export const useRoute = () => useContext(RouterContext).route;
export const useHash = () => useContext(RouterContext).hash;
