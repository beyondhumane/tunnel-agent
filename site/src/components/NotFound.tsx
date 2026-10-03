import { docPath } from '@/lib/router';
import { url } from '@/lib/site';

export function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">This tunnel leads nowhere</h1>
      <p className="mt-3 text-muted">The page you are looking for does not exist or has moved.</p>
      <div className="mt-8 flex gap-3">
        <a href={url('/')} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          Home
        </a>
        <a href={url(docPath())} className="rounded-lg border border-line-strong bg-btn px-4 py-2 text-sm font-medium hover:bg-btn-hover">
          Documentation
        </a>
      </div>
    </section>
  );
}
