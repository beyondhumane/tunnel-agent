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

function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="aurora -top-[20vh] -left-[10vw] h-[60vh] w-[55vw] bg-accent/20" />
      <div className="aurora top-[35vh] -right-[15vw] h-[55vh] w-[45vw] bg-accent-hover/15 [animation-delay:-9s] [animation-duration:34s]" />
      <div className="aurora -bottom-[25vh] left-[20vw] h-[50vh] w-[50vw] bg-ok/10 [animation-delay:-18s] [animation-duration:40s]" />
      <div className="dots" />
      <div className="grain" />
    </div>
  );
}

export function Site({ path }: { path: string }) {
  return (
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
  );
}
