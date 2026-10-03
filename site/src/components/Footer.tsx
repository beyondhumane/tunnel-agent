import { Wordmark } from './Logo';
import { docPath } from '@/lib/router';
import { CHANGELOG_URL, ISSUES_URL, LICENSE_URL, RELEASES_URL, REPO_URL, url, VERSION } from '@/lib/site';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: url('/#features') },
      { label: 'Download', href: url('/#download') },
      { label: 'Changelog', href: CHANGELOG_URL },
      { label: 'Releases', href: RELEASES_URL },
    ],
  },
  {
    title: 'Docs',
    links: [
      { label: 'Introduction', href: url(docPath('introduction')) },
      { label: 'Quick start', href: url(docPath('quick-start')) },
      { label: 'Coding agents', href: url(docPath('agents')) },
      { label: 'Troubleshooting', href: url(docPath('troubleshooting')) },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub', href: REPO_URL },
      { label: 'Issues', href: ISSUES_URL },
      { label: 'Contributing', href: url(docPath('contributing')) },
      { label: 'MIT License', href: LICENSE_URL },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-side">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Wordmark />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Desktop control center for local AI proxies. Connect the subscriptions you already have and point any coding agent at one endpoint.
          </p>
          <p className="mt-4 font-mono text-xs text-faint">v{VERSION} · MIT</p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h2 className="text-xs font-semibold tracking-wider text-faint uppercase">{c.title}</h2>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
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
          Tunnel Agent is an independent open-source project. Provider names and logos belong to their owners.
        </p>
      </div>
    </footer>
  );
}
