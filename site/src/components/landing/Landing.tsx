import {
  Activity, ArrowRight, BookOpen, Bot, Coins, Download, GitBranch, Globe, KeyRound, Languages, MonitorCheck, Power, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppleIcon, GitHubIcon, LinuxIcon, WindowsIcon } from '../icons';
import { AppMock } from './AppMock';
import { AGENTS, IDES, PROVIDERS } from './brands';
import { BrandIcon, Endpoint, Eyebrow, Section } from './ui';
import { Reveal, Tilt, spotlight, useInView, useReducedMotion } from '@/lib/motion';
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
  'sheen group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/30 active:translate-y-0';
const btnSecondary =
  'group inline-flex items-center justify-center gap-2 rounded-lg border border-line-strong bg-btn px-4 py-2.5 text-sm font-medium text-fg transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-btn-hover active:translate-y-0';

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
      <div className="bg-grid animate-grid-pan pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
      <div className="animate-float pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
      <div
        className="animate-float pointer-events-none absolute top-40 left-[80%] h-[320px] w-[420px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl [animation-delay:-8s] [animation-duration:20s]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-20">
        <div>
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noreferrer"
            className="group animate-rise inline-flex items-center gap-2 rounded-full border border-line bg-card py-1 pr-3 pl-1 text-xs text-muted transition-colors hover:border-accent/40 hover:text-fg"
          >
            <span className="relative rounded-full bg-accent-soft px-2 py-0.5 font-mono font-semibold text-accent">v{VERSION}</span>
            Now on Windows, macOS and Linux
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </a>
          <h1 className="animate-rise mt-6 text-4xl font-semibold tracking-tight text-balance [animation-delay:80ms] sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]">
            One local endpoint for every{' '}
            <span className="animate-shimmer bg-[linear-gradient(90deg,var(--accent),var(--accent-hover),#8DB6FC,var(--accent-hover),var(--accent))] bg-[length:200%_100%] bg-clip-text text-transparent">
              AI subscription
            </span>{' '}
            you already pay for.
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted [animation-delay:160ms]">
            Tunnel Agent is a desktop control center for CLIProxyAPI, Perplexity WebUI Scraper and 9Router. Sign in to your providers, start the
            proxy with one click and point Claude Code, Codex, OpenCode or any coding agent at <Endpoint>localhost</Endpoint>.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
            <a href={url('/#download')} className={btnPrimary}>
              <Download className="size-4 transition-transform group-hover:translate-y-0.5" /> Download for free
            </a>
            <a href={url(docPath('quick-start'))} className={btnSecondary}>
              <BookOpen className="size-4 transition-transform group-hover:-rotate-6" /> Quick start
            </a>
          </div>
          <p className="animate-rise mt-6 flex items-center gap-3 text-xs text-faint [animation-delay:320ms]">
            <WindowsIcon className="size-3.5" /> <AppleIcon className="size-3.5" /> <LinuxIcon className="size-3.5" />
            <span>Open source · MIT · No account required</span>
          </p>
        </div>
        <div className="animate-rise relative [animation-delay:200ms] [animation-duration:1.1s]">
          <div className="halo animate-float-y">
            <Tilt>
              <AppMock />
            </Tilt>
          </div>
          <FloatChip className="-top-5 left-6 [animation-delay:-1s] sm:left-16">
            <span className="size-1.5 rounded-full bg-ok shadow-[0_0_8px_var(--ok)]" />
            <span className="font-mono">POST /v1/messages</span>
            <span className="rounded bg-ok/15 px-1 font-mono text-ok">200</span>
          </FloatChip>
          <FloatChip className="right-4 bottom-12 [animation-delay:-3s] sm:-right-4">
            <GitBranch className="size-3.5 text-accent" />
            <span>
              Fallback <span className="font-mono text-fg">claude → gpt-5</span>
            </span>
          </FloatChip>
          <p className="mt-3 text-center text-xs text-faint">Interactive preview — click the sidebar. It follows the site theme, just like the app.</p>
        </div>
      </div>
    </section>
  );
}

const STRIP = [...PROVIDERS.filter((p) => p.icon), ...IDES];

function Strip() {
  return (
    <div className="border-y border-line bg-side/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-6 sm:px-6">
        <span className="shrink-0 text-xs font-medium tracking-wide text-faint uppercase">Works with</span>
        <div className="marquee-mask group min-w-0 flex-1 overflow-hidden">
          <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={copy === 1 || undefined}>
                {STRIP.map((p) => (
                  <li
                    key={p.name}
                    className="flex items-center gap-2 rounded-full border border-line bg-card/80 py-1.5 pr-3.5 pl-2 text-sm whitespace-nowrap text-muted shadow-sm transition-colors hover:border-accent/40 hover:text-fg"
                  >
                    <BrandIcon brand={p} className="size-5" />
                    {p.name}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
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
      <div onPointerMove={spotlight} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }, i) => (
          <Reveal key={title} delay={(i % 3) * 90} className="card-x spot group overflow-hidden rounded-2xl p-6 hover:-translate-y-1">
            <Icon
              className="pointer-events-none absolute -right-6 -bottom-6 size-32 text-accent opacity-[0.05] transition-all duration-500 group-hover:-rotate-12 group-hover:opacity-[0.12]"
              aria-hidden="true"
            />
            <div className="flex items-center justify-between">
              <span className="icon-tile size-10 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Icon className="size-5" />
              </span>
              <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-5 font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </Reveal>
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
      <div onPointerMove={spotlight} className="grid gap-4 lg:grid-cols-3">
        {ENGINES.map((e, i) => (
          <Reveal
            key={e.name}
            delay={i * 110}
            className="card-x spot flex flex-col overflow-hidden rounded-2xl p-6 hover:-translate-y-1"
          >
            <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-ok">
                <Pulse /> Running
              </span>
              <Endpoint>127.0.0.1:{e.port}</Endpoint>
            </div>
            <Spark seed={i} />
            <h3 className="mt-4 text-lg font-semibold">{e.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{e.text}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {e.tags.map((t) => (
                <span key={t} className="rounded-full border border-line bg-side px-2 py-0.5 text-xs text-muted">
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
          </Reveal>
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
    <section className="border-y border-line bg-side/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Reveal>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="text-gradient mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From download to first prompt in minutes.</h2>
            </Reveal>
            <ol className="relative mt-10 space-y-6">
              <span className="absolute top-2 bottom-2 left-[13px] w-px bg-gradient-to-b from-accent via-accent/40 to-transparent" aria-hidden="true" />
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.n} delay={i * 140} className="group relative flex gap-4">
                  <span className="icon-tile relative size-7 shrink-0 rounded-full font-mono text-[11px] transition-transform duration-300 group-hover:scale-110">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal delay={150} className="halo">
            <div className="card-x overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-xs text-muted">
              <span className="size-2 rounded-full bg-err/70" /> <span className="size-2 rounded-full bg-warn/70" /> <span className="size-2 rounded-full bg-ok/70" />
              <span className="ml-2 font-mono">any OpenAI-compatible client</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
              <code>
                <Line d={300}>
                  <span className="text-faint"># the endpoint Tunnel Agent starts for you</span>
                </Line>
                <Line d={600}>
                  <span className="text-accent">export</span> OPENAI_BASE_URL=<span className="text-ok">http://127.0.0.1:8317/v1</span>
                </Line>
                <Line d={900}>
                  <span className="text-accent">export</span> OPENAI_API_KEY=<span className="text-ok">&lt;key from Configuration&gt;</span>
                </Line>
                <Line d={1100}> </Line>
                <Line d={1300}>curl $OPENAI_BASE_URL/models \</Line>
                <Line d={1500}>
                  {'  '}-H <span className="text-ok">"Authorization: Bearer $OPENAI_API_KEY"</span>
                </Line>
                <Line d={1700}> </Line>
                <Line d={1900}>
                  <span className="text-faint"># or skip all of this: Agents → Configure</span>
                  <span className="animate-caret ml-1 inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-accent" aria-hidden="true" />
                </Line>
              </code>
            </pre>
            </div>
          </Reveal>
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
      <div onPointerMove={spotlight} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AGENTS.map((a, i) => (
          <Reveal
            key={a.name}
            delay={(i % 4) * 80}
            className="card-x spot group flex items-center gap-3 rounded-2xl p-4 hover:-translate-y-0.5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-side transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]">
              <BrandIcon brand={a} className="size-8" />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{a.name}</p>
              <p className="truncate font-mono text-[11px] text-muted">{a.config}</p>
            </div>
          </Reveal>
        ))}
        <Reveal delay={(AGENTS.length % 4) * 80} className="flex">
          <a
            href={url(docPath('agents'))}
            className="group flex flex-1 items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong p-4 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            Anything that speaks the OpenAI or Anthropic API <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </a>
        </Reveal>
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

const TOUR_MS = 5000;

function Tour() {
  const [active, setActive] = useState(SHOTS[0].id);
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>();
  const shot = SHOTS.find((s) => s.id === active)!;
  const reduced = useReducedMotion();
  const playing = auto && inView && !paused && !reduced;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      const i = SHOTS.findIndex((s) => s.id === active);
      setActive(SHOTS[(i + 1) % SHOTS.length].id);
    }, TOUR_MS);
    return () => clearTimeout(t);
  }, [playing, active]);

  return (
    <Section id="tour" eyebrow="Tour" title="See the real thing." intro="Screenshots from the desktop app in dark mode.">
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Screenshots">
        {SHOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === active}
            onClick={() => {
              setActive(s.id);
              setAuto(false);
            }}
            className={`relative shrink-0 overflow-hidden rounded-lg px-3 py-1.5 text-sm transition-colors duration-300 ${
              s.id === active ? 'bg-accent text-white' : 'text-muted hover:bg-btn-hover hover:text-fg'
            }`}
          >
            {s.label}
            {s.id === active && playing && (
              <span
                key={active}
                className="animate-progress absolute inset-x-0 bottom-0 h-0.5 origin-left bg-white/70"
                style={{ '--dur': `${TOUR_MS}ms` } as React.CSSProperties}
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        className="card-x relative mt-6 flex justify-center overflow-hidden rounded-2xl p-3 sm:p-8"
      >
        <div className="bg-grid animate-grid-pan pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
        <img
          key={shot.id}
          src={shot.src}
          alt={`Tunnel Agent ${shot.label} view`}
          width={820}
          height={620}
          className="animate-view relative h-auto w-full max-w-[820px] rounded-xl border border-line-strong shadow-2xl"
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
    <section id="download" className="scroll-mt-20 border-t border-line bg-side/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <Reveal className="max-w-2xl">
          <Eyebrow>Download</Eyebrow>
          <h2 className="text-gradient mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Get Tunnel Agent {VERSION}</h2>
          <p className="mt-4 text-lg text-muted">Free and open source. Pick your platform — every build is published on GitHub Releases.</p>
        </Reveal>
        <div onPointerMove={spotlight} className="mt-12 grid gap-4 lg:grid-cols-3">
          {OS.map(({ id, name, Icon, note }, n) => (
            <Reveal
              key={id}
              delay={n * 110}
              className="card-x spot group/os rounded-2xl p-6 hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <span className="icon-tile size-11 rounded-xl transition-transform duration-300 group-hover/os:scale-110 group-hover/os:-rotate-6">
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
                      className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:translate-x-0.5 ${
                        i === 0 ? 'sheen bg-accent text-white hover:bg-accent-hover hover:shadow-md hover:shadow-accent/30' : 'border border-line hover:border-accent/40 hover:bg-btn-hover'
                      }`}
                    >
                      <span className="font-medium">{d.label}</span>
                      <span className={`flex items-center gap-2 text-xs ${i === 0 ? 'text-white/80' : 'text-muted'}`}>
                        {d.detail} <Download className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
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
      <Reveal className="animate-gradient relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,var(--accent),var(--accent-hover),#0F55C8,var(--accent))] bg-[length:300%_300%] px-6 py-14 text-center text-white sm:px-12">
        <div className="bg-grid animate-grid-pan pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden="true" />
        <div className="animate-float pointer-events-none absolute -top-24 left-1/2 h-64 w-[600px] rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
        <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Read the docs, open an issue, send a PR.</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/80">
          Guides for every screen, troubleshooting for common errors and everything you need to contribute.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <a href={url(docPath())} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#146CF9] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg">
            <BookOpen className="size-4" /> Documentation
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
          >
            <Globe className="size-4" /> Star on GitHub
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function FloatChip({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`absolute z-10 hidden items-center gap-2 rounded-full border border-line-strong bg-card/90 px-3 py-1.5 text-xs text-muted shadow-lg shadow-accent/10 backdrop-blur-md [animation:bob_5s_ease-in-out_infinite] sm:flex ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

/** Tiny animated traffic sparkline for engine cards. */
function Spark({ seed }: { seed: number }) {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const y = 18 - (Math.sin(i * 0.7 + seed * 1.9) * 6 + Math.sin(i * 1.7 + seed) * 3 + i * 0.25);
    return `${(i / 23) * 200},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 200 32" className="mt-5 h-8 w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`spark${seed}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${pts} 200,32`} fill={`url(#spark${seed})`} />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" className="animate-flow" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Pulse() {
  return (
    <span className="relative flex size-1.5">
      <span className="animate-ping-soft absolute inset-0 rounded-full bg-ok" />
      <span className="relative size-1.5 rounded-full bg-ok" />
    </span>
  );
}

function Line({ d, children }: { d: number; children: React.ReactNode }) {
  return (
    <span className="type-line block" style={{ '--d': `${d}ms` } as React.CSSProperties}>
      {children}
    </span>
  );
}
