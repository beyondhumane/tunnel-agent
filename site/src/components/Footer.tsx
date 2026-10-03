import { Wordmark } from './Logo';
import { useI18n } from '@/lib/i18n';
import type { Dict } from '@/i18n/en';
import { docPath } from '@/lib/router';
import { CHANGELOG_URL, ISSUES_URL, LICENSE_URL, RELEASES_URL, REPO_URL, url, VERSION } from '@/lib/site';

const columns = (f: Dict['footer']) => [
  {
    title: f.product,
    links: [
      { label: f.features, href: url('/#features') },
      { label: f.download, href: url('/#download') },
      { label: f.changelog, href: CHANGELOG_URL },
      { label: f.releases, href: RELEASES_URL },
    ],
  },
  {
    title: f.docs,
    links: [
      { label: f.introduction, href: url(docPath('introduction')) },
      { label: f.quickStart, href: url(docPath('quick-start')) },
      { label: f.agents, href: url(docPath('agents')) },
      { label: f.troubleshooting, href: url(docPath('troubleshooting')) },
    ],
  },
  {
    title: f.project,
    links: [
      { label: 'GitHub', href: REPO_URL },
      { label: f.issues, href: ISSUES_URL },
      { label: f.contributing, href: url(docPath('contributing')) },
      { label: f.license, href: LICENSE_URL },
    ],
  },
];

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-line bg-side">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Wordmark />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t.footer.tagline}
          </p>
          <p className="mt-4 font-mono text-xs text-faint">v{VERSION} · MIT</p>
        </div>
        {columns(t.footer).map((c) => (
          <div key={c.title}>
            <h2 className="text-xs font-semibold tracking-wider text-faint uppercase">{c.title}</h2>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="text-sm text-muted transition-colors hover:text-fg"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-faint sm:px-6">
          {t.footer.disclaimer}
        </p>
      </div>
    </footer>
  );
}
