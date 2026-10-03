import {
  Activity, ArrowRight, BookOpen, Bot, Coins, Download, GitBranch, Globe, KeyRound, Languages, MonitorCheck, Power, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppleIcon, GitHubIcon, LinuxIcon, WindowsIcon } from '../icons';
import { AppMock } from './AppMock';
import { AGENTS, IDES, PROVIDERS } from './brands';
import { AppWindow, type WindowView } from './AppWindow';
import { BrandIcon, Endpoint, Eyebrow, Section } from './ui';
import { Reveal, Tilt, spotlight, useInView, useReducedMotion } from '@/lib/motion';
import { docPath } from '@/lib/router';
import { DOWNLOADS, RELEASES_URL, REPO_URL, VERSION } from '@/lib/site';
import { useI18n } from '@/lib/i18n';

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
      <Faq />
      <Cta />
    </>
  );
}

function Faq() {
  const { t, url } = useI18n();
  return (
    <Section id="faq" eyebrow={t.faq.eyebrow} title={t.faq.title} intro={t.faq.intro}>
      <div className="mx-auto max-w-3xl space-y-3">
        {t.faq.items.map((item, i) => (
          <Reveal key={item.question} delay={i * 40} className="card-x rounded-2xl p-5 sm:p-6">
            <h3 className="font-semibold">{item.question}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</p>
            <a href={url(docPath(item.doc))} className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
              {t.faq.more} <ArrowRight className="size-3.5" />
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Hero() {
  const { t, url } = useI18n();
  const h = t.hero;
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
            {h.badge}
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </a>
          <h1 className="animate-rise mt-6 text-4xl font-semibold tracking-tight text-balance [animation-delay:80ms] sm:text-5xl lg:text-[3.6rem] lg:leading-[1.05]">
            {h.title1}{' '}
            <span className="animate-shimmer bg-[linear-gradient(90deg,var(--accent),var(--accent-hover),#8DB6FC,var(--accent-hover),var(--accent))] bg-[length:200%_100%] bg-clip-text text-transparent">
              {h.titleAccent}
            </span>{' '}
            {h.title2}
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted [animation-delay:160ms]">
            {h.lead1} <Endpoint>localhost</Endpoint>
            {h.lead2}
          </p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3 [animation-delay:240ms]">
            <a href={url('/#download')} className={btnPrimary}>
              <Download className="size-4 transition-transform group-hover:translate-y-0.5" /> {h.download}
            </a>
            <a href={url(docPath('quick-start'))} className={btnSecondary}>
              <BookOpen className="size-4 transition-transform group-hover:-rotate-6" /> {h.quickStart}
            </a>
          </div>
          <p className="animate-rise mt-6 flex items-center gap-3 text-xs text-faint [animation-delay:320ms]">
            <WindowsIcon className="size-3.5" /> <AppleIcon className="size-3.5" /> <LinuxIcon className="size-3.5" />
            <span>{h.meta}</span>
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
              {h.fallback} <span className="font-mono text-fg">claude → gpt-5</span>
            </span>
          </FloatChip>
          <p className="mt-3 text-center text-xs text-faint">{h.preview}</p>
        </div>
      </div>
    </section>
  );
}

const STRIP = [...PROVIDERS.filter((p) => p.icon), ...IDES];

function Strip() {
  const { t } = useI18n();
  return (
    <div className="border-y border-line bg-side/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-6 sm:px-6">
        <span className="shrink-0 text-xs font-medium tracking-wide text-faint uppercase">{t.strip.works}</span>
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

const FEATURE_ICONS = [Power, KeyRound, Activity, GitBranch, Bot, Coins, ShieldCheck, Languages, RefreshCw];

function Features() {
  const { t } = useI18n();
  const f = t.features;
  return (
    <Section id="features" eyebrow={f.eyebrow} title={f.title} intro={f.intro}>
      <div onPointerMove={spotlight} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {f.items.map(({ title, text }, i) => {
          const Icon = FEATURE_ICONS[i];
          return (
          <Reveal key={i} delay={(i % 3) * 90} className="card-x spot group overflow-hidden rounded-2xl p-6 hover:-translate-y-1">
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
          );
        })}
      </div>
    </Section>
  );
}

const ENGINES = [
  {
    name: 'CLIProxyAPI',
    repo: 'router-for-me/CLIProxyAPI',
    port: 8317,
  },
  {
    name: 'Perplexity WebUI Scraper',
    repo: 'Villoh/perplexity-webui-scraper',
    port: 8327,
  },
  {
    name: '9Router',
    repo: 'decolua/9router',
    port: 20128,
  },
];

function Engines() {
  const { t } = useI18n();
  const en = t.engines;
  return (
    <Section id="engines" eyebrow={en.eyebrow} title={en.title} intro={en.intro}>
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
                <Pulse /> {en.running}
              </span>
              <Endpoint>127.0.0.1:{e.port}</Endpoint>
            </div>
            <Spark seed={i} />
            <h3 className="mt-4 text-lg font-semibold">{e.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{en.items[i].text}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {en.items[i].tags.map((tag) => (
                <span key={tag} className="rounded-full border border-line bg-side px-2 py-0.5 text-xs text-muted">
                  {tag}
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

function HowItWorks() {
  const { t } = useI18n();
  const h = t.how;
  return (
    <section className="border-y border-line bg-side/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-12 [&>*]:min-w-0 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Reveal>
              <Eyebrow>{h.eyebrow}</Eyebrow>
              <h2 className="text-gradient mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{h.title}</h2>
            </Reveal>
            <ol className="relative mt-10 space-y-6">
              <span className="absolute top-2 bottom-2 left-[13px] w-px bg-gradient-to-b from-accent via-accent/40 to-transparent" aria-hidden="true" />
              {h.steps.map((s, i) => (
                <Reveal as="li" key={i} delay={i * 140} className="group relative flex gap-4">
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
              <span className="ml-2 font-mono">{h.client}</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed">
              <code>
                <Line d={300}>
                  <span className="text-faint">{h.comment1}</span>
                </Line>
                <Line d={600}>
                  <span className="text-accent">export</span> OPENAI_BASE_URL=<span className="text-ok">http://127.0.0.1:8317/v1</span>
                </Line>
                <Line d={900}>
                  <span className="text-accent">export</span> OPENAI_API_KEY=<span className="text-ok">{h.key}</span>
                </Line>
                <Line d={1100}> </Line>
                <Line d={1300}>curl $OPENAI_BASE_URL/models \</Line>
                <Line d={1500}>
                  {'  '}-H <span className="text-ok">"Authorization: Bearer $OPENAI_API_KEY"</span>
                </Line>
                <Line d={1700}> </Line>
                <Line d={1900}>
                  <span className="text-faint">{h.comment2}</span>
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
  const { t, url } = useI18n();
  const a = t.agents;
  return (
    <Section id="agents" eyebrow={a.eyebrow} title={a.title} intro={a.intro}>
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
            {a.any} <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </a>
        </Reveal>
      </div>
    </Section>
  );
}

const SHOTS: WindowView[] = ['home', 'cliproxy', 'perplexity', 'quota', 'fallback', 'agents', 'config', 'logs'];

const TOUR_MS = 5000;

function Tour() {
  const { t } = useI18n();
  const [active, setActive] = useState<WindowView>('home');
  const [auto, setAuto] = useState(true);
  const [paused, setPaused] = useState(false);
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const playing = auto && inView && !paused && !reduced;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      const i = SHOTS.indexOf(active);
      setActive(SHOTS[(i + 1) % SHOTS.length]);
    }, TOUR_MS);
    return () => clearTimeout(t);
  }, [playing, active]);

  return (
    <Section id="tour" eyebrow={t.tour.eyebrow} title={t.tour.title} intro={t.tour.intro}>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t.tour.tabs}>
        {SHOTS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === active}
            onClick={() => {
              setActive(id);
              setAuto(false);
            }}
            className={`relative shrink-0 overflow-hidden rounded-lg px-3 py-1.5 text-sm transition-colors duration-300 ${
              id === active ? 'bg-accent text-white' : 'text-muted hover:bg-btn-hover hover:text-fg'
            }`}
          >
            {t.tour.shots[id]}
            {id === active && playing && (
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
        <div className="relative w-full max-w-[920px]">
          <AppWindow
            view={active}
            onView={(v) => {
              setActive(v);
              setAuto(false);
            }}
          />
        </div>
      </div>
    </Section>
  );
}

const OS = [
  { id: 'windows', name: 'Windows', Icon: WindowsIcon },
  { id: 'macos', name: 'macOS', Icon: AppleIcon },
  { id: 'linux', name: 'Linux', Icon: LinuxIcon },
] as const;

function Downloads() {
  const { t, url } = useI18n();
  const d = t.download;
  return (
    <section id="download" className="scroll-mt-20 border-t border-line bg-side/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <Reveal className="max-w-2xl">
          <Eyebrow>{d.eyebrow}</Eyebrow>
          <h2 className="text-gradient mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{d.title(VERSION)}</h2>
          <p className="mt-4 text-lg text-muted">{d.intro}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{d.note}</p>
        </Reveal>
        <div onPointerMove={spotlight} className="mt-12 grid gap-4 lg:grid-cols-3">
          {OS.map(({ id, name, Icon }, n) => (
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
                  <p className="text-xs text-muted">{d.os[id]}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2">
                {DOWNLOADS.filter((x) => x.os === id).map((x, i) => {
                  const item = d.items[DOWNLOADS.indexOf(x)];
                  return (
                  <li key={x.href}>
                    <a
                      href={x.href}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:translate-x-0.5 ${
                        i === 0 ? 'sheen bg-accent text-white hover:bg-accent-hover hover:shadow-md hover:shadow-accent/30' : 'border border-line hover:border-accent/40 hover:bg-btn-hover'
                      }`}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className={`flex items-center gap-2 text-xs ${i === 0 ? 'text-white/80' : 'text-muted'}`}>
                        {item.detail} <Download className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                      </span>
                    </a>
                  </li>
                  );
                })}
              </ul>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-accent hover:underline">
            {d.all} <ArrowRight className="size-3.5" />
          </a>
          <a href={url(docPath('installation'))} className="inline-flex items-center gap-1.5 hover:text-fg">
            <MonitorCheck className="size-3.5" /> {d.guide}
          </a>
        </p>
      </div>
    </section>
  );
}

function Cta() {
  const { t, url } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal className="animate-gradient relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,var(--accent),var(--accent-hover),#0F55C8,var(--accent))] bg-[length:300%_300%] px-6 py-14 text-center text-white sm:px-12">
        <div className="bg-grid animate-grid-pan pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden="true" />
        <div className="animate-float pointer-events-none absolute -top-24 left-1/2 h-64 w-[600px] rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
        <h2 className="relative text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{t.cta.title}</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/80">
          {t.cta.text}
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <a href={url(docPath())} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#146CF9] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg">
            <BookOpen className="size-4" /> {t.cta.docs}
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10"
          >
            <Globe className="size-4" /> {t.cta.star}
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
