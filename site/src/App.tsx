import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { DocsPage } from './components/docs/DocsPage';
import { Landing } from './components/landing/Landing';
import { NotFound } from './components/NotFound';
import { RouterProvider, useRoute } from './lib/router';

function Page() {
  const route = useRoute();
  if (route.view === 'docs') return <DocsPage slug={route.slug} />;
  if (route.view === 'missing') return <NotFound />;
  return <Landing />;
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
