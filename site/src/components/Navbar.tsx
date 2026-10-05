import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GitHubIcon } from './icons';
import { Wordmark } from './Logo';
import { LangToggle } from './LangToggle';
import { ThemeToggle } from './ThemeToggle';
import { useI18n } from '@/lib/i18n';
import { docPath, useRoute } from '@/lib/router';
import { REPO_URL } from '@/lib/site';

export function Navbar() {
  const route = useRoute();
  const { t, url } = useI18n();
  const LINKS = [
    { label: t.nav.features, href: '/#features' },
    { label: t.nav.engines, href: '/#engines' },
    { label: t.nav.agents, href: '/#agents' },
    { label: t.nav.download, href: '/#download' },
  ];
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [route]);

  const docs = route.view === 'docs';
  const link = 'rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-btn-hover hover:text-fg';

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled || docs || open ? 'border-line bg-win/85 backdrop-blur-xl' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <a href={url('/')} className="flex shrink-0 items-center text-fg transition-transform duration-300 hover:scale-[1.03]" aria-label={t.nav.home}>
          <Wordmark />
        </a>
        <div className="hidden flex-1 items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={url(l.href)} className={link}>
              {l.label}
            </a>
          ))}
          <a href={url(docPath())} className={`${link} ${docs ? 'bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent' : ''}`}>
            {t.nav.docs}
          </a>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LangToggle />
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-lg border border-line-strong bg-btn px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-btn-hover sm:inline-flex"
          >
            <GitHubIcon /> GitHub
          </a>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-btn-hover hover:text-fg md:hidden"
            aria-label={open ? t.nav.close : t.nav.open}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="animate-view border-t border-line px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {[...LINKS, { label: t.nav.docs, href: docPath() }].map((l) => (
              <a key={l.href} href={url(l.href)} className="rounded-lg px-3 py-2 text-sm text-fg hover:bg-btn-hover">
                {l.label}
              </a>
            ))}
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg hover:bg-btn-hover">
              <GitHubIcon /> GitHub
            </a>
            <div className="flex items-center justify-between px-3 py-1 text-sm text-fg sm:hidden">
              {t.theme.label}
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
