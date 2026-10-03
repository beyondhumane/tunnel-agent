import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { DocsPage } from './components/docs/DocsPage';
import { Landing } from './components/landing/Landing';
import { NotFound } from './components/NotFound';
import { useEffect } from 'react';
import { langFromPath, RouterProvider, useRoute } from './lib/router';
import { pageData } from './lib/seo';
import { I18nProvider, useI18n } from './lib/i18n';

function Page() {
  const route = useRoute();
  const { lang } = useI18n();
  useEffect(() => {
    const data = pageData(route, lang);
    document.title = data.title;
    document.head.querySelectorAll('[data-page-seo]').forEach((el) => el.remove());
    for (const attrs of data.meta) {
      const el = document.createElement('meta');
      Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
      el.setAttribute('data-page-seo', '');
      document.head.append(el);
    }
    if (route.view !== 'missing') {
      for (const attrs of [{ rel: 'canonical', href: data.canonical }, ...data.alternates.map((a) => ({ rel: 'alternate', hreflang: a.lang, href: a.href }))]) {
        const el = document.createElement('link');
        Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
        el.setAttribute('data-page-seo', '');
        document.head.append(el);
      }
    }
    if (data.ld) {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.textContent = JSON.stringify(data.ld);
      el.setAttribute('data-page-seo', '');
      document.head.append(el);
    }
  }, [route, lang]);
  const view = route.view === 'docs' ? <DocsPage slug={route.slug} /> : route.view === 'missing' ? <NotFound /> : <Landing />;
  return (
    <div key={route.view === 'docs' ? `docs/${route.slug}` : route.view} className={route.view === 'docs' ? undefined : 'animate-view'}>
      {view}
    </div>
  );
}

function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="aurora -top-[20vh] -left-[10vw] h-[60vh] w-[55vw] bg-accent/20" />
      <div className="aurora top-[35vh] -right-[15vw] h-[55vh] w-[45vw] bg-accent-hover/15 [animation-delay:-9s] [animation-duration:34s]" />
      <div className="aurora -bottom-[25vh] left-[20vw] h-[50vh] w-[50vw] bg-accent/15 [animation-delay:-18s] [animation-duration:40s]" />
      <div className="dots" />
      <div className="grain" />
    </div>
  );
}

export function Site({ path }: { path: string }) {
  return (
    <I18nProvider lang={langFromPath(path)}>
    <RouterProvider path={path}>
      <div className="relative flex min-h-dvh flex-col">
        <Backdrop />
        <Navbar />
        <main className="flex-1">
          <Page />
        </main>
        <Footer />
      </div>
    </RouterProvider>
    </I18nProvider>
  );
}
