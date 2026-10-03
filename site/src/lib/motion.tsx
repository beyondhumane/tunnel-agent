import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia(REDUCE).matches;

const REDUCE = '(prefers-reduced-motion: reduce)';

/** Live `prefers-reduced-motion` preference; false during SSR. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(REDUCE);
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduced;
}

let io: IntersectionObserver | undefined;
const observer = () =>
  (io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io!.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  ));

/** Fades and lifts its content in the first time it scrolls into view. */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  style,
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = observer();
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ ...style, '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** True while the element is on screen. */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView] as const;
}

/** Animates a number towards `value` whenever it changes. */
export function CountUp({ value, format, duration = 1200 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    if (reducedMotion()) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const n = a + (value - a) * (1 - Math.pow(1 - p, 3));
      from.current = n;
      setShown(n);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(shown)}</>;
}

/** Subtle 3D tilt that follows the pointer (mouse only). */
export function Tilt({ className = '', children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse' || reducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1400px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`transition-transform duration-300 ease-out will-change-transform ${className}`}>
      {children}
    </div>
  );
}

/** Tracks the pointer inside `.spot` cards so their glow follows it. */
export const spotlight = (e: React.PointerEvent<HTMLElement>) => {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.spot');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--x', `${e.clientX - r.left}px`);
  card.style.setProperty('--y', `${e.clientY - r.top}px`);
};
