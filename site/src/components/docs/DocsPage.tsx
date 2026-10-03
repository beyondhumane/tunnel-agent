import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, PencilLine } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Markdown, outline } from './Markdown';
import { docGroups, docsFor } from '@/lib/docs';
import { useI18n } from '@/lib/i18n';
import { docPath } from '@/lib/router';
import { REPO_URL, url } from '@/lib/site';

function Sidebar({ slug }: { slug: string }) {
  const { lang, t } = useI18n();
  const DOCS = docsFor(lang);
  return (
    <nav aria-label={t.docs.nav} className="space-y-6">
      {docGroups(DOCS).map((g) => (
        <div key={g}>
          <p className="px-3 text-xs font-semibold tracking-wider text-faint uppercase">{g}</p>
          <ul className="mt-2 space-y-0.5">
            {DOCS.filter((d) => d.group === g).map((d) => {
              const active = d.slug === slug;
              return (
                <li key={d.slug}>
                  <a
                    href={url(docPath(d.slug))}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active ? 'bg-accent text-white' : 'text-muted hover:bg-btn-hover hover:text-fg'
                    }`}
                  >
                    {d.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsPage({ slug }: { slug: string }) {
  const { lang, t } = useI18n();
  const DOCS = docsFor(lang);
  const i = DOCS.findIndex((d) => d.slug === slug);
  const page = DOCS[i];
  const prev = DOCS[i - 1];
  const next = DOCS[i + 1];
  const toc = useMemo(() => outline(page.body), [page.body]);
  const [menu, setMenu] = useState(false);
  const [current, setCurrent] = useState('');

  useEffect(() => {
    setMenu(false);
  }, [slug]);

  useEffect(() => {
    const els = toc.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setCurrent(top.target.id);
      },
      { rootMargin: '-72px 0px -70% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [toc]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)_200px]">
        <aside className="hidden lg:block">
          <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-10">
            <Sidebar slug={slug} />
          </div>
        </aside>

        <div className="min-w-0 py-8 lg:py-10">
          <div className="mb-6 lg:hidden">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-4 py-2.5 text-sm"
            >
              <span>
                <span className="text-muted">{page.group} / </span>
                {page.title}
              </span>
              <ChevronDown className={`size-4 text-muted transition-transform ${menu ? 'rotate-180' : ''}`} />
            </button>
            {menu && (
              <div className="mt-2 rounded-xl border border-line bg-card p-3">
                <Sidebar slug={slug} />
              </div>
            )}
          </div>

          <nav aria-label={t.docs.breadcrumb} className="flex items-center gap-1.5 text-xs text-muted">
            <a href={url('/')} className="hover:text-fg">
              {t.docs.home}
            </a>
            <ChevronRight className="size-3" />
            <a href={url(docPath())} className="hover:text-fg">
              {t.docs.docs}
            </a>
            <ChevronRight className="size-3" />
            <span className="text-fg">{page.title}</span>
          </nav>

          <article className="mt-4 max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{page.group}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{page.title}</h1>
            {page.description && <p className="mt-3 text-lg leading-relaxed text-muted">{page.description}</p>}
            <div className="prose mt-8">
              <Markdown source={page.body} />
            </div>
          </article>

          <div className="mt-12 flex max-w-3xl flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm">
            <a href={`${REPO_URL}/edit/main/${page.path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-muted hover:text-fg">
              <PencilLine className="size-3.5" /> {t.docs.edit}
            </a>
          </div>
          <div className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-2">
            {prev ? (
              <a href={url(docPath(prev.slug))} className="group rounded-xl border border-line bg-card p-4 transition-colors hover:border-accent">
                <span className="flex items-center gap-1 text-xs text-muted">
                  <ArrowLeft className="size-3" /> {t.docs.prev}
                </span>
                <span className="mt-1 block font-medium group-hover:text-accent">{prev.title}</span>
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a href={url(docPath(next.slug))} className="group rounded-xl border border-line bg-card p-4 text-right transition-colors hover:border-accent">
                <span className="flex items-center justify-end gap-1 text-xs text-muted">
                  {t.docs.next} <ArrowRight className="size-3" />
                </span>
                <span className="mt-1 block font-medium group-hover:text-accent">{next.title}</span>
              </a>
            )}
          </div>
        </div>

        <aside className="hidden xl:block">
          {toc.length > 0 && (
            <div className="sticky top-14 py-10">
              <p className="text-xs font-semibold tracking-wider text-faint uppercase">{t.docs.onThisPage}</p>
              <ul className="mt-3 space-y-1.5 border-l border-line">
                {toc.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className={`-ml-px block border-l py-0.5 text-[13px] transition-colors ${h.depth === 3 ? 'pl-6' : 'pl-3'} ${
                        current === h.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'
                      }`}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
