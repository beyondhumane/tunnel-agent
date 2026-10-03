import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  CircleMinus,
  CirclePlay,
  CirclePlus,
  Copy,
  Download,
  ExternalLink,
  LayoutGrid,
  PanelLeft,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ScrollText,
  Search,
  Server,
  Settings,
  SlidersHorizontal,
  Square,
  Sun,
  Trash2,
  Waypoints,
} from 'lucide-react';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { LogoMark } from '../Logo';
import { AGENTS, PROVIDERS, IDES, type Brand } from './brands';
import { BrandIcon } from './ui';
import { CountUp, useInView, useReducedMotion } from '@/lib/motion';
import { VERSION } from '@/lib/site';

export type WindowView = 'home' | 'cliproxy' | 'perplexity' | 'quota' | 'fallback' | 'agents' | 'config' | 'logs';

const brand = (name: string): Brand => [...PROVIDERS, ...IDES].find((p) => p.name === name) ?? { name };
const stagger = (i: number, step = 55) => ({ animationDelay: `${80 + i * step}ms` }) as CSSProperties;

const NAV: { id: WindowView; label: string; Icon: typeof LayoutGrid; badge?: number; match?: WindowView[] }[] = [
  { id: 'home', label: 'Home', Icon: LayoutGrid },
  { id: 'cliproxy', label: 'Providers', Icon: Server, badge: 3, match: ['cliproxy', 'perplexity'] },
  { id: 'quota', label: 'Quota', Icon: BarChart3, badge: 5 },
  { id: 'fallback', label: 'Fallback', Icon: Waypoints },
  { id: 'agents', label: 'Agents', Icon: Bot, badge: 5 },
  { id: 'logs', label: 'Logs', Icon: ScrollText },
  { id: 'config', label: 'Configuration', Icon: Settings },
];

/**
 * Full-size, interactive replica of the desktop window used by the landing tour.
 * Controlled: the parent owns the active view so it can sync its tabs.
 */
export function AppWindow({ view, onView }: { view: WindowView; onView: (v: WindowView) => void }) {
  const [engines, setEngines] = useState({ cliproxy: true, perplexity: true, proxy: true });
  const toggle = (k: keyof typeof engines) => setEngines((e) => ({ ...e, [k]: !e[k] }));

  return (
    <div className="w-full max-w-[920px] overflow-hidden rounded-xl border border-line-strong bg-win text-left text-fg shadow-2xl">
      <div className="flex h-9 items-center justify-end gap-2 border-b border-line px-3" aria-hidden="true">
        <span className="size-3 rounded-full bg-[#F8D77F]" />
        <span className="size-3 rounded-full bg-[#7FD98B]" />
        <span className="size-3 rounded-full bg-[#F07C94]" />
      </div>
      <div className="flex h-[560px]">
        <aside className="flex w-14 shrink-0 flex-col border-r border-line bg-side sm:w-52">
          <div className="flex items-center justify-between px-3 pt-3 pb-3 text-[14px]">
            <span className="flex items-center gap-2">
              <LogoMark className="size-5 shrink-0" />
              <span className="hidden sm:inline">
                <b>Tunnel</b> Agent
              </span>
            </span>
            <PanelLeft className="hidden size-4 text-muted sm:block" />
          </div>
          <nav className="flex flex-col gap-0.5 px-2" aria-label="App replica navigation">
            {NAV.map(({ id, label, Icon, badge, match }) => {
              const active = (match ?? [id]).includes(view);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onView(id)}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[13.5px] transition-colors duration-200 ${
                    active ? 'bg-accent text-white' : 'hover:bg-btn-hover'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden flex-1 text-left sm:inline">{label}</span>
                  {badge && (
                    <span className={`hidden rounded-full px-1.5 text-[11px] sm:inline ${active ? 'bg-white/20' : 'text-muted'}`}>{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto hidden border-t border-line px-2 pt-3 sm:block">
            <p className="px-2 pb-2 text-[10px] font-semibold tracking-wider text-faint">STATUS</p>
            <div className="flex flex-col gap-1.5">
              {(
                [
                  ['cliproxy', 'CLIProxyAPI'],
                  ['perplexity', 'Perplexity'],
                  ['proxy', 'Local Proxy'],
                ] as const
              ).map(([k, name]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(k)}
                  title={engines[k] ? `Stop ${name}` : `Start ${name}`}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2 text-[12.5px] font-medium transition-colors hover:border-line-strong"
                >
                  <Dot on={engines[k]} />
                  <span className="flex-1 text-left">{name}</span>
                  <ChevronRight className="size-3.5 text-faint" />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 hidden items-end justify-between border-t border-line px-3 py-2.5 sm:flex">
            <div className="text-[10.5px] leading-tight">
              <p className="text-faint">v{VERSION} · MIT</p>
              <p className="text-accent">Report an issue</p>
            </div>
            <Sun className="size-4 text-muted" />
          </div>
        </aside>
        <div key={view} className="animate-view min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-width:thin] sm:p-5">
          {view === 'home' && <HomeView />}
          {(view === 'cliproxy' || view === 'perplexity') && (
            <ProvidersView engine={view} running={engines[view]} onEngine={onView} onToggle={() => toggle(view)} />
          )}
          {view === 'quota' && <QuotaView />}
          {view === 'fallback' && <FallbackView />}
          {view === 'agents' && <AgentsView />}
          {view === 'config' && <ConfigView />}
          {view === 'logs' && <LogsView />}
        </div>
      </div>
    </div>
  );
}

/* ---------- primitives ---------- */

function Dot({ on }: { on: boolean }) {
  if (!on) return <span className="size-2 shrink-0 rounded-full bg-err" />;
  return (
    <span className="relative flex size-2 shrink-0">
      <span className="animate-ping-soft absolute inset-0 rounded-full bg-ok" />
      <span className="relative size-2 rounded-full bg-ok" />
    </span>
  );
}

function Title({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[19px] font-semibold">{title}</h3>
        <p className="text-[12.5px] text-muted">{subtitle}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3 pt-1 text-muted">{actions}</div>}
    </div>
  );
}

function Segmented<T extends string>({ items, value, onChange }: { items: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl border border-line bg-card p-1">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={`flex flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
            value === it.id ? 'bg-accent text-white' : 'hover:bg-btn-hover'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${on ? 'bg-accent' : 'bg-line-strong'}`}
    >
      <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function Panel({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`animate-rise rounded-xl border border-line bg-card ${className}`} style={style}>
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mt-5 mb-2 px-1 text-[10.5px] font-semibold tracking-[0.12em] text-faint uppercase">{children}</p>;
}

function Icon({ children, title }: { children: ReactNode; title: string }) {
  return (
    <button type="button" title={title} aria-label={title} className="rounded-md p-1 transition-colors hover:bg-btn-hover hover:text-fg">
      {children}
    </button>
  );
}

/* ---------- views ---------- */

const RANGES = ['Today', '7 days', '14 days', '30 days', 'All'] as const;
const SERIES = {
  Calls: [40, 62, 55, 90, 74, 120, 98, 140, 410, 160, 132, 180, 150, 210],
  Tokens: [12, 18, 15, 30, 26, 41, 38, 52, 95, 61, 58, 72, 66, 88],
  Cost: [8, 11, 9, 16, 14, 22, 19, 27, 60, 31, 29, 36, 33, 45],
};

function HomeView() {
  const [range, setRange] = useState<(typeof RANGES)[number]>('7 days');
  const [metric, setMetric] = useState<keyof typeof SERIES>('Calls');
  const [live, setLive] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setLive((n) => n + 1 + Math.floor(Math.random() * 3)), 1600);
    return () => clearInterval(t);
  }, [reduced]);
  const k = { Today: 0.12, '7 days': 1, '14 days': 1.9, '30 days': 3.8, All: 7.2 }[range];
  const calls = Math.round(1468 * k) + live;
  const stats: { label: string; value: number; fmt: (n: number) => string; sub: string; tone: string }[] = [
    { label: 'Total calls', value: calls, fmt: (n) => Math.round(n).toLocaleString('en-US'), sub: '3 providers', tone: 'text-accent' },
    { label: 'Success rate', value: 95.6, fmt: (n) => `${n.toFixed(1)}%`, sub: `${Math.round(calls * 0.956)} successful`, tone: 'text-ok' },
    { label: 'Failures', value: Math.round(calls * 0.044), fmt: (n) => `${Math.round(n)}`, sub: 'Failure rate 4.4%', tone: 'text-err' },
    { label: 'Est. cost', value: 236.21 * k + live * 0.07, fmt: (n) => `$${n.toFixed(2)}`, sub: 'From model unit prices', tone: 'text-warn' },
    { label: 'Total tokens', value: 193.7 * k + live * 0.02, fmt: (n) => `${n.toFixed(1)}M`, sub: 'Reasoning 12.5K', tone: 'text-accent' },
    { label: 'Input tokens', value: 38.1 * k, fmt: (n) => `${n.toFixed(1)}M`, sub: 'Share 19.7%', tone: 'text-accent' },
    { label: 'Output tokens', value: 896.4 * k, fmt: (n) => `${n.toFixed(1)}K`, sub: 'Share 0.5%', tone: 'text-accent' },
    { label: 'Cache tokens', value: 177.2 * k, fmt: (n) => `${n.toFixed(1)}M`, sub: 'Hit rate 82.3%', tone: 'text-accent' },
  ];
  const data = SERIES[metric];
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 600},${150 - (v / max) * 135}`).join(' ');

  return (
    <>
      <Title title="Dashboard" subtitle="Live overview of requests handled by the local proxy." />
      <Panel className="flex items-center justify-between gap-2 p-2">
        <div className="flex gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`shrink-0 rounded-lg px-3 py-1 text-[12.5px] transition-colors ${r === range ? 'bg-accent text-white' : 'hover:bg-btn-hover'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="hidden items-center gap-2 text-muted sm:flex">
          <RefreshCw className="size-4" />
          <Trash2 className="size-4 text-err" />
        </div>
      </Panel>
      <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Panel key={s.label} className="p-3" style={stagger(i)}>
            <p className="text-[10px] tracking-[0.1em] text-muted uppercase">{s.label}</p>
            <p className={`mt-2 text-[21px] font-semibold tabular-nums ${s.tone}`}>
              <CountUp value={s.value} format={s.fmt} />
            </p>
            <p className="mt-1 text-[11px] text-muted">{s.sub}</p>
          </Panel>
        ))}
      </div>
      <Panel className="mt-3 p-3.5" style={stagger(8)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[13px] font-semibold text-accent">Usage chart</p>
            <p className="text-[11.5px] text-muted">Trend over the selected time range.</p>
          </div>
          <div className="w-52">
            <Segmented items={(['Calls', 'Tokens', 'Cost'] as const).map((id) => ({ id, label: id }))} value={metric} onChange={setMetric} />
          </div>
        </div>
        <svg key={metric + range} viewBox="0 0 600 160" className="mt-3 h-36 w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="aw-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--warn)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--warn)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="0" x2="600" y1={15 + i * 45} y2={15 + i * 45} stroke="var(--line)" strokeDasharray="3 4" />
          ))}
          <polygon points={`0,160 ${pts} 600,160`} fill="url(#aw-area)" className="fade-in" />
          <polyline points={pts} fill="none" stroke="var(--warn)" strokeWidth="2" pathLength={1} className="draw" vectorEffect="non-scaling-stroke" />
        </svg>
      </Panel>
    </>
  );
}

const CLI_PROVIDERS: { b: Brand; on: boolean; detail: string; key?: boolean }[] = [
  { b: brand('Claude'), on: true, detail: '1 connected account' },
  { b: brand('OpenAI'), on: true, detail: '2 connected accounts' },
  { b: brand('Kimi'), on: false, detail: '' },
  { b: brand('Antigravity'), on: false, detail: '' },
  { b: brand('xAI'), on: false, detail: '' },
  { b: brand('Gemini'), on: true, detail: '1 API key', key: true },
  { b: { name: 'Opencode' }, on: true, detail: '1 API key · opencode.ai/zen/go/v1', key: true },
];

function ProvidersView({
  engine,
  running,
  onEngine,
  onToggle,
}: {
  engine: 'cliproxy' | 'perplexity';
  running: boolean;
  onEngine: (v: WindowView) => void;
  onToggle: () => void;
}) {
  const [enabled, setEnabled] = useState(() => CLI_PROVIDERS.map((p) => p.on));
  const [copied, setCopied] = useState(false);
  const cli = engine === 'cliproxy';
  const port = cli ? 8317 : 8327;
  return (
    <>
      <Segmented
        items={[
          { id: 'cliproxy', label: 'CLIProxyAPI' },
          { id: 'perplexity', label: 'Perplexity' },
        ]}
        value={engine}
        onChange={onEngine}
      />
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-semibold">Services</h3>
          <p className="max-w-sm text-[12.5px] text-muted">
            {cli ? 'Unified proxy for OAuth and OpenAI-compatible upstream providers.' : 'OpenAI-compatible local API backed by Perplexity WebUI sessions.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <code className="rounded-lg border border-line-strong bg-code px-2 py-1 font-mono text-[12px] font-semibold text-fg">http://127.0.0.1:{port}</code>
          <button
            type="button"
            title="Copy endpoint"
            onClick={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="rounded-md p-1 hover:bg-btn-hover"
          >
            {copied ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
          </button>
          <button type="button" title={running ? 'Stop' : 'Start'} onClick={onToggle} className="rounded-md p-1 hover:bg-btn-hover">
            {running ? <Square className="size-3.5 fill-err text-err" /> : <Play className="size-4 text-ok" />}
          </button>
        </div>
      </div>
      <Panel className="mt-3 flex items-center gap-3 px-4 py-3">
        <Dot on={running} />
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold">{cli ? 'CLIProxyAPI' : 'Perplexity WebUI Scraper'}</p>
          <p className="text-[11.5px] text-muted">Listening on port {port}</p>
        </div>
        <span className={`text-[12.5px] font-semibold ${running ? 'text-ok' : 'text-err'}`}>{running ? 'Running' : 'Stopped'}</span>
      </Panel>

      {cli ? (
        <Panel className="mt-3 divide-y divide-line px-3" style={stagger(1)}>
          {CLI_PROVIDERS.map((p, i) => (
            <div key={p.b.name} className="animate-rise flex items-center gap-3 py-2.5" style={stagger(i + 2, 45)}>
              <Switch on={enabled[i]} onChange={() => setEnabled((e) => e.map((v, j) => (j === i ? !v : v)))} label={`Enable ${p.b.name}`} />
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-side">
                <BrandIcon brand={p.b} className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[13px] font-semibold">
                  {p.b.name}
                  {!enabled[i] && <span className="rounded bg-warn/15 px-1.5 text-[10px] font-medium text-warn">disabled</span>}
                </p>
                {enabled[i] && p.detail && <p className="truncate text-[11.5px] text-ok">{p.detail}</p>}
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <Plus className="size-4" />
                {p.key && <Pencil className="hidden size-3.5 sm:block" />}
                {p.key && <SlidersHorizontal className="hidden size-3.5 sm:block" />}
                {enabled[i] && <Trash2 className="size-3.5 text-err" />}
                <ChevronRight className="size-4" />
              </div>
            </div>
          ))}
        </Panel>
      ) : (
        <>
          <Panel className="mt-3 p-4" style={stagger(1)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-semibold">Perplexity session accounts</p>
                <p className="text-[11.5px] text-muted">Saved WebUI session tokens used by Perplexity WebUI Scraper.</p>
              </div>
              <Plus className="size-5 text-muted" />
            </div>
            {['Pro · default', 'Pro · research'].map((a, i) => (
              <div key={a} className="animate-rise mt-2.5 flex items-center gap-3 rounded-lg bg-side px-3 py-2.5" style={stagger(i + 2, 90)}>
                <BrandIcon brand={{ name: 'Perplexity' }} className="size-6" />
                <div className="flex-1">
                  <p className="text-[12.5px] font-medium">{a}</p>
                  <p className="font-mono text-[11px] text-muted">pplx-session ••••••••{i ? '7c1e' : 'a91f'}</p>
                </div>
                <span className="rounded-full bg-ok/15 px-2 py-0.5 text-[10px] font-semibold text-ok">Active</span>
              </div>
            ))}
          </Panel>
          <Label>Available models</Label>
          <Panel className="p-4" style={stagger(4)}>
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent">
                <Brain className="size-4" />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">Available models</p>
                <p className="text-[11.5px] text-muted">Models exposed by the running engine.</p>
              </div>
            </div>
            {running ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-deep-research', 'gpt-5', 'claude-sonnet-4.5'].map((m, i) => (
                  <span key={m} className="animate-rise rounded-md border border-line bg-side px-2 py-1 font-mono text-[11.5px]" style={stagger(i + 5, 50)}>
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-center text-[12px] text-muted">Start the engine to see available models</p>
            )}
          </Panel>
        </>
      )}
    </>
  );
}

const QUOTA: { b: Brand; plan: string; a: number; b5: number; reset: [string, string] }[] = [
  { b: brand('Claude'), plan: 'Max', a: 34, b5: 71, reset: ['2h 12m', '3d 4h'] },
  { b: brand('OpenAI'), plan: 'Team', a: 0, b5: 97, reset: ['4h 59m', '20h 3m'] },
  { b: brand('Antigravity'), plan: 'Pro', a: 18, b5: 42, reset: ['3h 40m', '5d 1h'] },
  { b: brand('xAI'), plan: 'SuperGrok', a: 6, b5: 22, reset: ['1h 05m', '6d 2h'] },
  { b: brand('Cursor'), plan: 'Pro', a: 51, b5: 64, reset: ['—', '12d'] },
  { b: brand('Devin'), plan: 'Team', a: 12, b5: 30, reset: ['—', '9d'] },
  { b: brand('Trae'), plan: 'Pro', a: 27, b5: 58, reset: ['—', '18d'] },
];

function QuotaView() {
  const [i, setI] = useState(1);
  const [spin, setSpin] = useState(0);
  const q = QUOTA[i];
  return (
    <>
      <div className="flex rounded-xl border border-line bg-card p-1">
        {QUOTA.map((p, n) => (
          <button
            key={p.b.name}
            type="button"
            title={p.b.name}
            onClick={() => setI(n)}
            className={`flex flex-1 justify-center rounded-lg py-1.5 transition-colors ${n === i ? 'bg-accent' : 'hover:bg-btn-hover'}`}
          >
            <BrandIcon brand={p.b} className={`size-4.5 ${n === i ? 'brightness-0 invert' : ''}`} />
          </button>
        ))}
      </div>
      <div className="mt-4">
        <Title
          title="Quota"
          subtitle="Track quota usage for supported CLIProxyAPI accounts."
          actions={
            <Icon title="Refresh">
              <RefreshCw className="size-4 transition-transform duration-700" style={{ rotate: `${spin * 360}deg` }} onClick={() => setSpin((s) => s + 1)} />
            </Icon>
          }
        />
      </div>
      <Panel key={`${i}-${spin}`} className="p-4">
        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">{q.plan}</span>
          <span className="font-mono text-[13px] tracking-wider">•••••••••••@••••••••</span>
          <RefreshCw className="ml-auto size-4 text-muted" />
        </div>
        <p className="mt-4 text-[10.5px] font-semibold tracking-[0.12em] text-faint uppercase">Usage</p>
        {(
          [
            ['Primary (5h)', q.a, q.reset[0]],
            ['Weekly', q.b5, q.reset[1]],
          ] as const
        ).map(([k, v, r], n) => (
          <div key={k} className="mt-3">
            <div className="flex justify-between text-[12.5px]">
              <span className="font-semibold">{k}</span>
              <span className={`font-semibold ${v > 90 ? 'text-warn' : 'text-accent'}`}>{v}% used</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-btn-hover">
              <div
                className={`animate-grow-x h-full origin-left rounded-full ${v > 90 ? 'bg-warn' : 'bg-accent'}`}
                style={{ width: `${v}%`, animationDelay: `${150 + n * 150}ms` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-faint">Resets in {r}</p>
          </div>
        ))}
      </Panel>
    </>
  );
}

const CHAIN: { b: Brand; label: string; model: string }[] = [
  { b: brand('Claude'), label: 'Anthropic', model: 'claude-opus-4-8' },
  { b: brand('OpenAI'), label: 'OpenAI', model: 'gpt-5.5' },
  { b: { name: 'Opencode' }, label: 'Opencode', model: 'glm-5.2' },
];

function FallbackView() {
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(true);
  const [chain, setChain] = useState(CHAIN);
  const [serving, setServing] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !enabled) return;
    const t = setInterval(() => setServing((s) => (s + 1) % chain.length), 2200);
    return () => clearInterval(t);
  }, [reduced, enabled, chain.length]);
  const move = (i: number, d: -1 | 1) =>
    setChain((c) => {
      const n = [...c];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      return n;
    });

  return (
    <>
      <Title title="Model Fallback" subtitle="Virtual models map to real provider models with automatic fallback when quota is exhausted." />
      <Label>Settings</Label>
      <Panel className="flex items-center gap-4 p-4">
        <div className="flex-1">
          <p className="text-[13.5px] font-semibold">Enable Fallback</p>
          <p className="text-[11.5px] text-muted">
            Virtual models fall back to alternative providers when quota is exhausted. This switch also starts and stops the local proxy.
          </p>
        </div>
        <Switch on={enabled} onChange={() => setEnabled((e) => !e)} label="Enable fallback" />
      </Panel>
      <div className="mt-5 mb-2 flex items-center justify-between px-1">
        <p className="text-[10.5px] font-semibold tracking-[0.12em] text-faint uppercase">Virtual models</p>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-accent-soft px-1.5 text-[11px] text-accent">1</span>
          <Plus className="size-4 text-muted" />
        </span>
      </div>
      <Panel className="p-3.5" style={stagger(1)}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Toggle entries" className="rounded p-0.5 hover:bg-btn-hover">
            <ChevronDown className={`size-4 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
          </button>
          <div className="flex-1">
            <p className="font-mono text-[13.5px] font-semibold">claude-opus-4-8</p>
            <p className="text-[11px] text-muted">{chain.length} entries</p>
          </div>
          <Trash2 className="size-4 text-err" />
          <Switch on={enabled} onChange={() => setEnabled((e) => !e)} label="Enable virtual model" />
        </div>
        {open && (
          <ol className="mt-3 border-t border-line pt-2">
            {chain.map((e, i) => {
              const live = enabled && i === serving;
              return (
                <li
                  key={e.label}
                  className={`animate-rise flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-300 ${live ? 'bg-ok/10' : ''}`}
                  style={stagger(i, 70)}
                >
                  <span className="w-4 text-center text-[11.5px] text-muted">{i + 1}</span>
                  <span className="grid size-7 place-items-center rounded-md border border-line bg-side">
                    <BrandIcon brand={e.b} className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="flex items-center gap-2 text-[12.5px] font-semibold">
                      {e.label}
                      {live && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-ok">
                          <Dot on /> serving
                        </span>
                      )}
                      {enabled && i < serving && <span className="text-[10px] font-medium text-warn">quota exhausted</span>}
                    </p>
                    <p className="font-mono text-[11px] text-muted">{e.model}</p>
                  </div>
                  <div className="flex items-center gap-1 text-muted">
                    <CirclePlay className="size-4" />
                    {i > 0 && (
                      <Icon title="Move up">
                        <ArrowUp className="size-3.5" onClick={() => move(i, -1)} />
                      </Icon>
                    )}
                    {i < chain.length - 1 && (
                      <Icon title="Move down">
                        <ArrowDown className="size-3.5" onClick={() => move(i, 1)} />
                      </Icon>
                    )}
                    <CircleMinus className="size-4 text-err" />
                  </div>
                </li>
              );
            })}
            <li className="flex items-center gap-1.5 px-2 pt-1.5 text-[12px] text-accent">
              <CirclePlus className="size-4" /> Add Entry
            </li>
          </ol>
        )}
      </Panel>
      <p className="mt-4 px-1 text-[11.5px] text-muted">Point your agent at a virtual model name to use the chain.</p>
    </>
  );
}

const AGENT_INFO: Record<string, string> = {
  'Claude Code': "Anthropic's official CLI coding agent.",
  'Codex CLI': 'OpenAI Codex command-line interface.',
  OpenCode: 'Open-source AI coding agent.',
  Pi: 'Pi coding agent by pi.dev.',
  'Oh My Pi': 'Batteries-included Pi distribution.',
  'Factory Droid': "Factory's AI coding agent.",
  'Grok Build': "xAI's terminal coding agent.",
};

function AgentsView() {
  const [configured, setConfigured] = useState(() => AGENTS.map((_, i) => i > 0 && i < 6));
  const installed = AGENTS.length - 1;
  return (
    <>
      <Title
        title="Agents"
        subtitle="Route each CLI tool through a connected provider."
        actions={
          <>
            <Settings className="size-4" />
            <RefreshCw className="size-4" />
          </>
        }
      />
      <div className="-mt-2 flex gap-2 text-[12px] font-medium">
        <span className="rounded-md bg-ok/15 px-2 py-0.5 text-ok">{installed} installed</span>
        <span className="rounded-md bg-accent-soft px-2 py-0.5 text-accent">{configured.filter(Boolean).length} configured</span>
      </div>
      <Label>Installed</Label>
      <div className="flex flex-col gap-2">
        {AGENTS.slice(0, installed).map((a, i) => (
          <Panel key={a.name} className="flex items-center gap-3.5 px-4 py-3" style={stagger(i, 60)}>
            <BrandIcon brand={a} className="size-8" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[13.5px] font-semibold">
                {a.name}
                <span className={`rounded px-1.5 text-[10px] font-semibold ${configured[i] ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn'}`}>
                  {configured[i] ? 'Configured' : 'Installed'}
                </span>
              </p>
              <p className="text-[11.5px] text-muted">{AGENT_INFO[a.name]}</p>
              <p className="truncate font-mono text-[11px] text-muted">{a.config}</p>
            </div>
            <div className="flex items-center gap-1 text-muted">
              <ExternalLink className="hidden size-4 sm:block" />
              <Icon title={configured[i] ? 'Restore original config' : 'Configure'}>
                <Settings className="size-4" onClick={() => setConfigured((c) => c.map((v, j) => (j === i ? !v : v)))} />
              </Icon>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

function ConfigView() {
  const [tab, setTab] = useState<'general' | 'cli' | 'pplx'>('general');
  const [opts, setOpts] = useState({ updates: true, login: true, hide: true, debug: false, usage: true, retry: true });
  const [checking, setChecking] = useState<'idle' | 'busy' | 'done'>('idle');
  const flip = (k: keyof typeof opts) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  const Row = ({ title, sub, children }: { title: string; sub: string; children: ReactNode }) => (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="flex-1">
        <p className="text-[13px] font-semibold">{title}</p>
        <p className="text-[11.5px] text-muted">{sub}</p>
      </div>
      {children}
    </div>
  );
  const Select = ({ value }: { value: string }) => (
    <span className="flex w-36 items-center justify-between rounded-lg border border-line-strong bg-win px-2.5 py-1.5 text-[12.5px]">
      {value} <ChevronDown className="size-3.5 text-muted" />
    </span>
  );
  return (
    <>
      <Segmented
        items={[
          { id: 'general', label: 'General' },
          { id: 'cli', label: 'CLIProxyAPI' },
          { id: 'pplx', label: 'Perplexity' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div key={tab} className="animate-view mt-4">
        {tab === 'general' ? (
          <>
            <Title title="General" subtitle="App appearance and startup." />
            <Label>Tunnel Agent</Label>
            <Panel className="divide-y divide-line">
              <Row title="Tunnel Agent" sub={checking === 'done' ? `Up to date: ${VERSION}` : `Installed: ${VERSION}`}>
                <button
                  type="button"
                  onClick={() => {
                    setChecking('busy');
                    setTimeout(() => setChecking('done'), 1100);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-btn px-3 py-1 text-[12.5px] font-medium hover:bg-btn-hover"
                >
                  {checking === 'busy' && <RefreshCw className="size-3.5 animate-spin" />}
                  {checking === 'done' && <Check className="size-3.5 text-ok" />}
                  Check
                </button>
              </Row>
              <Row title="Auto-check for app updates" sub="Check GitHub for a new Tunnel Agent version on startup.">
                <Switch on={opts.updates} onChange={() => flip('updates')} label="Auto-check for updates" />
              </Row>
            </Panel>
            <Label>App</Label>
            <Panel className="divide-y divide-line" style={stagger(2)}>
              <Row title="Launch at login" sub="Start automatically and stay in the system tray.">
                <Switch on={opts.login} onChange={() => flip('login')} label="Launch at login" />
              </Row>
              <Row title="Theme" sub="Follow system theme or force light/dark mode.">
                <Select value="System" />
              </Row>
              <Row title="Language" sub="Choose the display language.">
                <Select value="System default" />
              </Row>
              <Row title="Hide sensitive information" sub="Replaces account emails with dots to keep them private.">
                <Switch on={opts.hide} onChange={() => flip('hide')} label="Hide sensitive information" />
              </Row>
            </Panel>
          </>
        ) : (
          <>
            <Title
              title={tab === 'cli' ? 'CLIProxyAPI' : 'Perplexity WebUI Scraper'}
              subtitle={tab === 'cli' ? 'Engine binary, network and routing.' : 'Engine binary and session settings.'}
            />
            <Label>Engine</Label>
            <Panel className="divide-y divide-line">
              <Row title="Version" sub={tab === 'cli' ? 'Installed: v6.6.80 · latest' : 'Installed: v0.9.4 · latest'}>
                <span className="flex items-center gap-1.5 text-[12px] text-ok">
                  <Check className="size-3.5" /> Up to date
                </span>
              </Row>
              <Row title="Port" sub="Local port the engine listens on.">
                <code className="rounded-lg border border-line-strong bg-code px-2.5 py-1 font-mono text-[12.5px]">{tab === 'cli' ? 8317 : 8327}</code>
              </Row>
              {tab === 'cli' && (
                <Row title="Routing strategy" sub="How requests are spread across accounts.">
                  <Select value="Round robin" />
                </Row>
              )}
              <Row title="Request retry" sub="Retry failed upstream requests automatically.">
                <Switch on={opts.retry} onChange={() => flip('retry')} label="Request retry" />
              </Row>
              <Row title="Usage statistics" sub="Record requests for the dashboard and logs.">
                <Switch on={opts.usage} onChange={() => flip('usage')} label="Usage statistics" />
              </Row>
              <Row title="Debug logging" sub="Verbose engine output in Proxy Logs.">
                <Switch on={opts.debug} onChange={() => flip('debug')} label="Debug logging" />
              </Row>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}

type Req = { id: number; provider: string; model: string; status: number; ms: number; at: string };
const SAMPLES: Omit<Req, 'id' | 'at' | 'ms'>[] = [
  { provider: 'Openai-compatible-opencode', model: 'kimi-k2.7-code', status: 200 },
  { provider: 'Claude', model: 'claude-opus-4-8', status: 200 },
  { provider: 'Codex', model: 'gpt-5.5', status: 200 },
  { provider: 'Gemini', model: 'gemini-3-pro', status: 200 },
  { provider: 'Claude', model: 'claude-sonnet-4-6', status: 429 },
  { provider: 'Perplexity', model: 'sonar-pro', status: 200 },
];
const stamp = (offset: number) => {
  const d = new Date(Date.UTC(2026, 9, 3, 11, 20, 18) - offset * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};
const seed = (): Req[] => Array.from({ length: 8 }, (_, i) => ({ id: -i, ...SAMPLES[i % SAMPLES.length], ms: 2.1 + ((i * 3.7) % 16), at: stamp(i * 17) }));

function LogsView() {
  const [tab, setTab] = useState<'req' | 'proxy'>('req');
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState('');
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !inView || tab !== 'req') return;
    let n = 1;
    const t = setInterval(() => {
      setRows((r) => [{ id: n, ...SAMPLES[Math.floor(Math.random() * SAMPLES.length)], ms: 1.5 + Math.random() * 14, at: stamp(-n * 3) }, ...r].slice(0, 12));
      n++;
    }, 1800);
    return () => clearInterval(t);
  }, [reduced, inView, tab]);
  const shown = rows.filter((r) => `${r.provider} ${r.model}`.toLowerCase().includes(q.toLowerCase()));
  const ok = rows.filter((r) => r.status === 200).length;

  return (
    <div ref={ref}>
      <Title
        title="Logs"
        subtitle="Request traffic routed through the local proxy."
        actions={
          <>
            <Download className="size-4" />
            <RefreshCw className="size-4" />
            <Trash2 className="size-4 text-err" />
          </>
        }
      />
      <Segmented
        items={[
          { id: 'req', label: 'Requests' },
          { id: 'proxy', label: 'Proxy Logs' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'req' ? (
        <>
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
            {[
              ['Total', `${1852 + rows.length}`],
              ['Success', `${Math.round((ok / rows.length) * 100)}%`],
              ['Avg time', `${(rows.reduce((s, r) => s + r.ms, 0) / rows.length).toFixed(1)}s`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[11.5px] text-muted">{k}</p>
                <p className="text-[16px] font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-[12.5px]">
            <Search className="size-4 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search requests…"
              className="w-full bg-transparent outline-none placeholder:text-muted"
              aria-label="Search requests"
            />
          </label>
          <Panel className="mt-3 divide-y divide-line px-3">
            {shown.map((r) => (
              <div key={r.id} className="animate-rise flex items-center gap-3 py-2">
                <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${r.status === 200 ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn'}`}>
                  {r.status}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">
                    {r.provider} <span className="font-mono text-[11px] font-normal text-muted">• {r.model}</span>
                  </p>
                  <p className="font-mono text-[11px] text-muted">/v1/messages</p>
                </div>
                <span className="hidden text-[10.5px] text-faint sm:inline">POST</span>
                <span className="w-14 text-right font-mono text-[11.5px] tabular-nums">{r.ms.toFixed(3)}s</span>
                <span className="hidden w-32 text-right font-mono text-[11px] text-faint md:inline">{r.at}</span>
              </div>
            ))}
            {!shown.length && <p className="py-6 text-center text-[12px] text-muted">No requests match “{q}”.</p>}
          </Panel>
        </>
      ) : (
        <pre className="animate-rise mt-3 overflow-x-auto rounded-xl border border-line bg-code p-3 font-mono text-[11.5px] leading-relaxed text-muted">
          {[
            '[11:20:18] INFO  server listening on 127.0.0.1:8317',
            '[11:20:18] INFO  loaded 4 auth files (claude, codex×2, gemini)',
            '[11:20:21] INFO  POST /v1/messages claude-opus-4-8 → claude 200 10.4s',
            '[11:20:39] WARN  claude quota exhausted, fallback → gpt-5.5',
            '[11:20:40] INFO  POST /v1/messages gpt-5.5 → codex 200 3.2s',
            '[11:20:52] INFO  POST /v1/chat/completions sonar-pro → perplexity 200 2.1s',
          ].map((l) => (
            <span key={l} className={`block ${l.includes('WARN') ? 'text-warn' : ''}`}>
              {l}
            </span>
          ))}
        </pre>
      )}
    </div>
  );
}
