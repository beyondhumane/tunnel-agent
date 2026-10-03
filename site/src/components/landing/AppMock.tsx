import { Bot, ChevronRight, GitBranch, Home, LayoutList, ScrollText, Server, Settings2 } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { LogoMark } from '../Logo';
import { AGENTS, PROVIDERS } from './brands';
import { BrandIcon } from './ui';
import { CountUp, useInView, useReducedMotion } from '@/lib/motion';
import { VERSION } from '@/lib/site';
import { useI18n } from '@/lib/i18n';

type View = 'home' | 'providers' | 'quota' | 'fallback' | 'agents';

const NAV: { id: View | 'logs' | 'config'; Icon: typeof Home; badge?: number }[] = [
  { id: 'home', Icon: Home },
  { id: 'providers', Icon: Server, badge: 4 },
  { id: 'quota', Icon: LayoutList, badge: 3 },
  { id: 'fallback', Icon: GitBranch },
  { id: 'agents', Icon: Bot, badge: 5 },
  { id: 'logs', Icon: ScrollText },
  { id: 'config', Icon: Settings2 },
];

const ENGINES = [
  { name: 'CLIProxyAPI', port: 8317, on: true },
  { name: 'Perplexity', port: 8327, on: true },
  { name: '9Router', port: 20128, on: false },
];

/** A live, theme-aware replica of the desktop window. Click the sidebar to switch views. */
const TOUR: View[] = ['home', 'providers', 'quota', 'fallback', 'agents'];
const stagger = (i: number, step = 60) => ({ animationDelay: `${120 + i * step}ms` }) as CSSProperties;

export function AppMock() {
  const [view, setView] = useState<View>('home');
  const [auto, setAuto] = useState(true);
  const [ref, inView] = useInView<HTMLDivElement>();

  const reduced = useReducedMotion();
  const { t } = useI18n();

  useEffect(() => {
    if (!auto || !inView || reduced) return;
    const t = setTimeout(() => setView((v) => TOUR[(TOUR.indexOf(v) + 1) % TOUR.length]), 4500);
    return () => clearTimeout(t);
  }, [auto, inView, reduced, view]);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border border-line-strong bg-win shadow-[0_30px_80px_-30px_rgb(20_108_249/0.35)] dark:shadow-[0_30px_100px_-30px_rgb(72_140_250/0.35)]">
      <div className="flex h-9 items-center justify-end gap-2 border-b border-line px-3" aria-hidden="true">
        <span className="size-3 rounded-full bg-[#F8D77F]" />
        <span className="size-3 rounded-full bg-[#7FD98B]" />
        <span className="size-3 rounded-full bg-[#F07C94]" />
      </div>
      <div className="flex h-[440px] text-left sm:h-[460px]">
        <aside className="flex w-14 shrink-0 flex-col border-r border-line bg-side p-2 sm:w-48">
          <div className="flex items-center justify-center gap-2 px-1.5 pt-1 pb-4 text-[13px] sm:justify-start">
            <LogoMark className="size-5 shrink-0" />
            <span className="hidden sm:inline">
              <b>Tunnel</b> Agent
            </span>
          </div>
          <nav className="flex flex-col gap-0.5" aria-label={t.app.navLabel}>
            {NAV.map(({ id, Icon, badge }) => {
              const clickable = id !== 'logs' && id !== 'config';
              const active = id === view;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!clickable}
                  onClick={() => {
                    if (!clickable) return;
                    setView(id as View);
                    setAuto(false);
                  }}
                  aria-pressed={active}
                  className={`flex items-center justify-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] sm:justify-start transition-colors duration-300 ${
                    active ? 'bg-accent text-white' : 'text-fg enabled:hover:bg-btn-hover disabled:opacity-60'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden flex-1 text-left sm:inline">{t.app.nav[id]}</span>
                  {badge && <span className={`hidden text-[11px] sm:inline ${active ? 'text-white/90' : 'text-muted'}`}>{badge}</span>}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto hidden sm:block">
            <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-faint">{t.app.status}</p>
            <div className="flex flex-col gap-1">
              {ENGINES.map((e) => (
                <div key={e.name} className="flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[12px] font-medium">
                  <Dot on={e.on} off="bg-err" />
                  <span className="flex-1">{e.name}</span>
                  <ChevronRight className="size-3.5 text-faint" />
                </div>
              ))}
            </div>
            <p className="px-1 pt-3 text-[10px] text-faint">v{VERSION} · MIT</p>
          </div>
        </aside>
        <div key={view} className="animate-view min-w-0 flex-1 overflow-hidden p-4 sm:p-5">
          {view === 'home' && <HomeView />}
          {view === 'providers' && <ProvidersView />}
          {view === 'quota' && <QuotaView />}
          {view === 'fallback' && <FallbackView />}
          {view === 'agents' && <AgentsView />}
        </div>
      </div>
    </div>
  );
}

function Title({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[17px] font-semibold">{title}</h3>
      <p className="text-[12px] text-muted">{subtitle}</p>
    </div>
  );
}

const BARS = [18, 26, 22, 38, 30, 46, 41, 58, 52, 64, 49, 72, 68, 80];

function Dot({ on, off = 'bg-faint' }: { on: boolean; off?: string }) {
  if (!on) return <span className={`size-1.5 shrink-0 rounded-full ${off}`} />;
  return (
    <span className="relative flex size-1.5 shrink-0">
      <span className="animate-ping-soft absolute inset-0 rounded-full bg-ok" />
      <span className="relative size-1.5 rounded-full bg-ok" />
    </span>
  );
}

function HomeView() {
  const [live, setLive] = useState(0);
  const reduced = useReducedMotion();
  const { t: { app: a } } = useI18n();
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setLive((n) => n + 1 + Math.floor(Math.random() * 4)), 1400);
    return () => clearInterval(t);
  }, [reduced]);
  const stats = [
    { k: a.requests, v: 12480 + live, f: (n: number) => Math.round(n).toLocaleString(a.numLocale) },
    { k: a.tokens, v: 38.2 + live * 0.004, f: (n: number) => `${n.toFixed(1)}M` },
    { k: a.estCost, v: 214 + Math.floor(live / 6), f: (n: number) => `$${Math.round(n)}` },
  ];
  return (
    <>
      <Title title={a.dashboard} subtitle={a.mockDashboardSub} />
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <div key={s.k} className="animate-rise rounded-xl border border-line bg-card p-2.5" style={stagger(i)}>
            <p className="text-[10px] tracking-wide text-muted uppercase">{s.k}</p>
            <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums">
              <CountUp value={s.v} format={s.f} />
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-line bg-card p-3">
        <p className="text-[11px] text-muted">{a.perDay}</p>
        <div className="mt-3 flex h-28 items-end gap-1" aria-hidden="true">
          {BARS.map((h, i) => (
            <div
              key={i}
              className={`animate-grow-y flex-1 origin-bottom rounded-t-sm transition-colors hover:bg-accent ${i === BARS.length - 1 ? 'bg-accent' : 'bg-accent/70'}`}
              style={{ height: `${h}%`, animationDelay: `${200 + i * 45}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {ENGINES.map((e, i) => (
          <div key={e.name} className="animate-rise flex items-center justify-between rounded-lg border border-line bg-card px-2.5 py-2 text-[12px]" style={stagger(i + 3)}>
            <span className="flex items-center gap-2">
              <Dot on={e.on} />
              {e.name}
            </span>
            <span className="font-mono text-[11px] text-muted">:{e.port}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function ProvidersView() {
  const { t: { app: a } } = useI18n();
  return (
    <>
      <Title title={a.nav.providers} subtitle={a.providersSub} />
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {PROVIDERS.slice(0, 8).map((p, i) => (
          <div key={p.name} className="animate-rise flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2.5" style={stagger(i, 50)}>
            <BrandIcon brand={p} className="size-5" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{p.name}</p>
              <p className="text-[11px] text-muted">{p.detail && (a.detail[p.detail] ?? p.detail)}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${i < 4 ? 'bg-ok/15 text-ok' : 'bg-btn-hover text-muted'}`}>
              {i < 4 ? a.connected : a.add}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function QuotaView() {
  const { t: { app: a } } = useI18n();
  const rows = [
    { name: 'Claude · Max', a: 34, b: 71 },
    { name: 'Codex · Team', a: 0, b: 97 },
    { name: 'Gemini · Pro', a: 12, b: 28 },
  ];
  return (
    <>
      <Title title={a.quota} subtitle={a.mockQuotaSub} />
      <div className="flex flex-col gap-2">
        {rows.map((r, n) => (
          <div key={r.name} className="animate-rise rounded-xl border border-line bg-card p-3" style={stagger(n, 90)}>
            <p className="text-[12px] font-semibold">{r.name}</p>
            {[
              [a.primary, r.a],
              [a.weekly, r.b],
            ].map(([k, v]) => (
              <div key={k} className="mt-2">
                <div className="flex justify-between text-[11px]">
                  <span>{k}</span>
                  <span className={Number(v) > 90 ? 'text-warn' : 'text-accent'}>{a.used(Number(v))}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-btn-hover">
                  <div
                    className={`animate-grow-x h-full origin-left rounded-full ${Number(v) > 90 ? 'bg-warn' : 'bg-accent'}`}
                    style={{ width: `${v}%`, animationDelay: `${300 + n * 120}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function FallbackView() {
  const { t: { app: a } } = useI18n();
  const chain = ['claude-opus-4', 'gpt-5-codex', 'gemini-2.5-pro'];
  return (
    <>
      <Title title={a.nav.fallback} subtitle={a.mockFallbackSub} />
      <div className="animate-rise rounded-xl border border-line bg-card p-3" style={stagger(0)}>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[13px] font-semibold">smart-coder</p>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">{a.virtual}</span>
        </div>
        <ol className="mt-3 flex flex-col gap-1.5">
          {chain.map((m, i) => (
            <li
              key={m}
              className={`animate-rise flex items-center gap-2.5 rounded-lg border bg-win px-2.5 py-2 text-[12px] ${i === 1 ? 'border-ok/40' : 'border-line'}`}
              style={stagger(i + 1, 220)}
            >
              <span className="grid size-5 place-items-center rounded-full bg-btn-hover font-mono text-[10px] text-muted">{i + 1}</span>
              <span className="flex-1 font-mono">{m}</span>
              {i === 1 && <Dot on />}
              <span className={`text-[10px] font-semibold ${i === 0 ? 'text-warn' : i === 1 ? 'text-ok' : 'text-faint'}`}>
                {i === 0 ? a.exhausted : i === 1 ? a.serving : a.standby}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function AgentsView() {
  const { t: { app: a } } = useI18n();
  return (
    <>
      <Title title={a.nav.agents} subtitle={a.agentsSub} />
      <div className="flex flex-col gap-1.5">
        {AGENTS.slice(0, 5).map((ag, i) => (
          <div key={ag.name} className="animate-rise flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2" style={stagger(i, 70)}>
            <BrandIcon brand={ag} className="size-6" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[13px] font-medium">
                {ag.name}
                <span className={`rounded-full px-1.5 text-[10px] font-semibold ${i === 0 ? 'bg-warn/15 text-warn' : 'bg-ok/15 text-ok'}`}>
                  {i === 0 ? a.installed : a.configured}
                </span>
              </p>
              <p className="truncate font-mono text-[10.5px] text-muted">{ag.config}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
