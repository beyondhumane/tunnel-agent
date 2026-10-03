import {
  Activity, ArrowRight, BookOpen, Bot, Coins, Download, GitBranch, Globe, KeyRound, Languages, MonitorCheck, Power, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { AppleIcon, GitHubIcon, LinuxIcon, WindowsIcon } from '../icons';
import { AppMock } from './AppMock';
import { AGENTS, IDES, PROVIDERS } from './brands';
import { BrandIcon, Card, Endpoint, Section } from './ui';
import { docPath } from '@/lib/router';
import { DOWNLOADS, RELEASES_URL, REPO_URL, url, VERSION } from '@/lib/site';
import agentsShot from '../../../../assets/agents.png';
import configShot from '../../../../assets/configuration.png';
import fallbackShot from '../../../../assets/fallback.png';
import homeShot from '../../../../assets/home.png';
import logsShot from '../../../../assets/logs.png';
import cliproxyShot from '../../../../assets/providers-cliproxy.png';
import perplexityShot from '../../../../assets/providers-perplexity.png';
import quotaShot from '../../../../assets/quota.png';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-hover';
const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-btn px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-btn-hover';

export function Landing() {
  return (
    <>
      <Hero />
      <Strip />
      <Features />
      <Engines />
      <HowItWorks />
      <Agents />
      <Tour />
      <Downloads />
      <Cta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-20">
        <div>
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card py-1 pr-3 pl-1 text-xs text-muted transition-colors hover:text-fg"
          >
            <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono font-semibold text-accent">v{VERSION}</span>
            Now on Windows, macOS and Linux
            <ArrowRight className="size-3" />
          </a>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]">
            One local endpoint for every <span className="text-accent">AI subscription</span> you already pay for.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted">
            Tunnel Agent is a desktop control center for CLIProxyAPI, Perplexity WebUI Scraper and 9Router. Sign in to your providers, start the
            proxy with one click and point Claude Code, Codex, OpenCode or any coding agent at <Endpoint>localhost</Endpoint>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={url('/#download')} className={btnPrimary}>
              <Download className="size-4" /> Download for free
            </a>
            <a href={url(docPath('quick-start'))} className={btnSecondary}>
              <BookOpen className="size-4" /> Quick start
            </a>
          </div>
          <p className="mt-6 flex items-center gap-3 text-xs text-faint">
            <WindowsIcon className="size-3.5" /> <AppleIcon className="size-3.5" /> <LinuxIcon className="size-3.5" />
            <span>Open source · MIT · No account required</span>
          </p>
        </div>
        <div className="relative">
          <AppMock />
          <p className="mt-3 text-center text-xs text-faint">Interactive preview — click the sidebar. It follows the site theme, just like the app.</p>
        </div>
      </div>
    </section>
  );
}

function Strip() {
  return (
    <div className="border-y border-line bg-side">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 py-6 sm:px-6">
        <span className="text-xs font-medium tracking-wide text-faint uppercase">Works with</span>
        {[...PROVIDERS.filter((p) => p.icon), ...IDES].map((p) => (
          <span key={p.name} className="flex items-center gap-2 text-sm text-muted">
            <BrandIcon brand={p} className="size-5" />
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { Icon: Power, title: 'One-click servers', text: 'Download, update, start and stop each engine from the app. Binaries are fetched from GitHub releases automatically.' },
  { Icon: KeyRound, title: 'Every way to sign in', text: 'OAuth for Claude, OpenAI, Kimi, Antigravity, xAI, Devin and Meta, API keys for Gemini or any OpenAI-compatible service, and Perplexity sessions.' },
  { Icon: Activity, title: 'Quota at a glance', text: 'Live 5-hour and weekly limits for Claude, Codex, Devin, Antigravity, xAI, Cursor, Kiro and Trae accounts.' },
  { Icon: GitBranch, title: 'Model fallback', text: 'Define virtual models that fall through a chain of real models when one provider runs out of quota.' },
  { Icon: Bot, title: 'Agent configuration', text: 'Detects installed coding agents and writes their config to route through your local endpoint. Reversible in one click.' },
  { Icon: Coins, title: 'Usage and cost', text: 'Requests, tokens and estimated spend per model, provider and day, aggregated across every engine.' },
  { Icon: ShieldCheck, title: 'Local by design', text: 'Engines listen on localhost only. Credentials stay on your disk; the app talks to providers, never to us.' },
  { Icon: Languages, title: '14 languages', text: 'English, Spanish, German, French, Japanese, Chinese and more. Light, dark or follow the system.' },
  { Icon: RefreshCw, title: 'Auto-updates', text: 'Installer builds update themselves; engines can be kept on the latest release or pinned.' },
];

function Features() {
  return (
    <Section
      id="features"
      eyebrow="Features"
      title="Everything between your subscriptions and your agents."
      intro="Proxies like CLIProxyAPI are powerful but live in config files and terminals. Tunnel Agent gives them a native window."
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className="bg-card p-6">
            <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
              <Icon className="size-4.5" />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

const ENGINES = [
  {
    name: 'CLIProxyAPI',
    repo: 'router-for-me/CLIProxyAPI',
    port: 8317,
    text: 'Unified proxy for OAuth and OpenAI-compatible upstream providers. The default engine for Claude, Codex, Gemini and friends.',
    tags: ['OAuth', 'API keys', 'Round robin', 'Fill first'],
  },
  {
    name: 'Perplexity WebUI Scraper',
    repo: 'Villoh/perplexity-webui-scraper',
    port: 8327,
    text: 'OpenAI-compatible local API backed by Perplexity WebUI sessions. Add accounts with a session token.',
    tags: ['Session tokens', 'Multi-account'],
  },
  {
    name: '9Router',
    repo: 'decolua/9router',
    port: 20128,
    text: 'OpenAI-compatible local router for 40+ providers with auto-fallback. Requires Node.js 18 or newer.',
    tags: ['40+ providers', 'Auto-fallback', 'Node.js'],
  },
];

function Engines() {
  return (
    <Section
      id="engines"
      eyebrow="Engines"
      title="Three engines, one window."
      intro="Run any combination side by side. Each engine gets its own port, logs, version and settings."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {ENGINES.map((e) => (
          <Card key={e.name} className="flex flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-ok">
                <span className="size-1.5 rounded-full bg-ok" /> Running
              </span>
              <Endpoint>127.0.0.1:{e.port}</Endpoint>
            </div>
            <h3 className="mt-5 text-lg font-semibold">{e.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{e.text}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {e.tags.map((t) => (
                <span key={t} className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                  {t}
                </span>
              ))}
            </div>
            <a
              href={`https://github.com/${e.repo}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 border-t border-line pt-4 text-xs text-muted hover:text-fg"
            >
              <GitHubIcon className="size-3.5" /> {e.repo}
            </a>
          </Card>
        ))}
      </div>
    </Section>
  );
}

const STEPS = [
  { n: '01', title: 'Install', text: 'Download the build for your OS. On first launch Tunnel Agent fetches the engine binaries for you.' },
  { n: '02', title: 'Connect', text: 'Open Providers and sign in with OAuth, paste an API key or add a Perplexity session.' },
  { n: '03', title: 'Start', text: 'Press Start. The engine listens on localhost and the status pill turns green.' },
  { n: '04', title: 'Code', text: 'In Agents, configure your CLI with one click — or point any OpenAI-compatible client at the endpoint.' },
];

function HowItWorks() {
  return (
    <section className="border-y border-line bg-side">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From download to first prompt in minutes.</h2>
            <ol className="mt-10 space-y-6">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="font-mono text-sm text-accent">{s.n}</span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs text-muted">
              <span className="size-2 rounded-full bg-err/70" /> <span className="size-2 rounded-full bg-warn/70" /> <span className="size-2 rounded-full bg-ok/70" />
              <span className="ml-2 font-mono">any OpenAI-compatible client</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
              <code>
                <span className="text-faint"># the endpoint Tunnel Agent starts for you</span>
                {'\n'}
                <span className="text-accent">export</span> OPENAI_BASE_URL=<span className="text-ok">http://127.0.0.1:8317/v1</span>
                {'\n'}
                <span className="text-accent">export</span> OPENAI_API_KEY=<span className="text-ok">&lt;key from Configuration&gt;</span>
                {'\n\n'}
                curl $OPENAI_BASE_URL/models \{'\n'}
                {'  '}-H <span className="text-ok">"Authorization: Bearer $OPENAI_API_KEY"</span>
                {'\n\n'}
                <span className="text-faint"># or skip all of this: Agents → Configure</span>
              </code>
            </pre>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Agents() {
  return (
    <Section
      id="agents"
      eyebrow="Coding agents"
      title="Your favourite CLI, on any model you have access to."
      intro="Tunnel Agent detects installed agents, backs up their config and writes the local endpoint, model and key. Restore the original whenever you want."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AGENTS.map((a) => (
          <Card key={a.name} className="flex items-center gap-3 p-4">
            <BrandIcon brand={a} className="size-8" />
            <div className="min-w-0">
              <p className="font-medium">{a.name}</p>
              <p className="truncate font-mono text-[11px] text-muted">{a.config}</p>
            </div>
          </Card>
        ))}
        <a
          href={url(docPath('agents'))}
          className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong p-4 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          Anything that speaks the OpenAI or Anthropic API <ArrowRight className="size-4 shrink-0" />
        </a>
      </div>
    </Section>
  );
}

const SHOTS = [
  { id: 'home', label: 'Dashboard', src: homeShot },
  { id: 'cliproxy', label: 'Providers', src: cliproxyShot },
  { id: 'perplexity', label: 'Perplexity', src: perplexityShot },
  { id: 'quota', label: 'Quota', src: quotaShot },
  { id: 'fallback', label: 'Fallback', src: fallbackShot },
  { id: 'agents', label: 'Agents', src: agentsShot },
  { id: 'config', label: 'Configuration', src: configShot },
  { id: 'logs', label: 'Logs', src: logsShot },
];

function Tour() {
  const [active, setActive] = useState(SHOTS[0].id);
  const shot = SHOTS.find((s) => s.id === active)!;
  return (
    <Section id="tour" eyebrow="Tour" title="See the real thing." intro="Screenshots from the desktop app in dark mode.">
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Screenshots">
        {SHOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === active}
            onClick={() => setActive(s.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              s.id === active ? 'bg-accent text-white' : 'text-muted hover:bg-btn-hover hover:text-fg'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-center rounded-2xl border border-line bg-side p-3 sm:p-8">
        <img
          src={shot.src}
          alt={`Tunnel Agent ${shot.label} view`}
          width={820}
          height={620}
          className="h-auto w-full max-w-[820px] rounded-xl border border-line-strong shadow-2xl"
        />
      </div>
    </Section>
  );
}

const OS = [
  { id: 'windows', name: 'Windows', Icon: WindowsIcon, note: 'Windows 10 or 11 · primary platform' },
  { id: 'macos', name: 'macOS', Icon: AppleIcon, note: 'Apple Silicon and Intel' },
  { id: 'linux', name: 'Linux', Icon: LinuxIcon, note: 'x64 and ARM64 builds' },
] as const;

function Downloads() {
  return (
    <section id="download" className="scroll-mt-20 border-t border-line bg-side">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Download</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Get Tunnel Agent {VERSION}</h2>
          <p className="mt-4 text-lg text-muted">Free and open source. Pick your platform — every build is published on GitHub Releases.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {OS.map(({ id, name, Icon, note }) => (
            <Card key={id} className="p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{name}</h3>
                  <p className="text-xs text-muted">{note}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2">
                {DOWNLOADS.filter((d) => d.os === id).map((d, i) => (
                  <li key={d.href}>
                    <a
                      href={d.href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        i === 0 ? 'bg-accent text-white hover:bg-accent-hover' : 'border border-line hover:bg-btn-hover'
                      }`}
                    >
                      <span className="font-medium">{d.label}</span>
                      <span className={`flex items-center gap-2 text-xs ${i === 0 ? 'text-white/80' : 'text-muted'}`}>
                        {d.detail} <Download className="size-3.5" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-accent hover:underline">
            All releases and checksums <ArrowRight className="size-3.5" />
          </a>
          <a href={url(docPath('installation'))} className="inline-flex items-center gap-1.5 hover:text-fg">
            <MonitorCheck className="size-3.5" /> Installation guide
          </a>
        </p>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-accent px-6 py-14 text-center text-white sm:px-12">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden="true" />
        <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Read the docs, open an issue, send a PR.</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/80">
          Guides for every screen, troubleshooting for common errors and everything you need to contribute.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <a href={url(docPath())} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#146CF9] hover:bg-white/90">
            <BookOpen className="size-4" /> Documentation
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Globe className="size-4" /> Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
