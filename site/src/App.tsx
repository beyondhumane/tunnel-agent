import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { DocsPage } from './components/docs/DocsPage';
import { Landing } from './components/landing/Landing';
import { NotFound } from './components/NotFound';
import { useEffect } from 'react';
import { RouterProvider, useRoute } from './lib/router';
import { pageMeta } from './lib/seo';

function Page() {
  const route = useRoute();
  const { title } = pageMeta(route);
  useEffect(() => {
    document.title = title;
  }, [title]);
  const view = route.view === 'docs' ? <DocsPage slug={route.slug} /> : route.view === 'missing' ? <NotFound /> : <Landing />;
  return (
    <div key={route.view === 'docs' ? `docs/${route.slug}` : route.view} className="animate-view">
      {view}
    </div>
  );
}

export function Site({ path }: { path: string }) {
  return (
    <RouterProvider path={path}>
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="flex-1">
          <Page />
        </main>
        <Footer />
      </div>
    </RouterProvider>
  );
}
