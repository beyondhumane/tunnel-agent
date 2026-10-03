import { docPath } from '@/lib/router';
import { url } from '@/lib/site';
import { useI18n } from '@/lib/i18n';

export function NotFound() {
  const { t } = useI18n();
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.notFound.title}</h1>
      <p className="mt-3 text-muted">{t.notFound.text}</p>
      <div className="mt-8 flex gap-3">
        <a href={url('/')} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          {t.notFound.home}
        </a>
        <a href={url(docPath())} className="rounded-lg border border-line-strong bg-btn px-4 py-2 text-sm font-medium hover:bg-btn-hover">
          {t.notFound.docs}
        </a>
      </div>
    </section>
  );
}
