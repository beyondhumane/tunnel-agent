import type { ReactNode } from 'react';
import type { Brand } from './brands';

export function Section({ id, eyebrow, title, intro, children }: { id?: string; eyebrow: string; title: ReactNode; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
        {intro && <p className="mt-4 text-base leading-relaxed text-pretty text-muted sm:text-lg">{intro}</p>}
      </div>
      <div className="mt-12">{children}</div>
    </section>
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-card ${className}`}>{children}</div>;
}

export function BrandIcon({ brand, className = 'size-5' }: { brand: Brand; className?: string }) {
  if (!brand.icon) {
    return (
      <span className={`grid place-items-center rounded-md bg-accent-soft text-[10px] font-bold text-accent ${className}`} aria-hidden="true">
        {brand.name[0]}
      </span>
    );
  }
  return <img src={brand.icon} alt="" className={`${className} ${brand.mono === 'dark' ? 'dark:invert' : ''}`} loading="lazy" decoding="async" />;
}

export function Endpoint({ children }: { children: ReactNode }) {
  return <code className="rounded-md border border-line bg-code px-1.5 py-0.5 font-mono text-[12px] text-fg">{children}</code>;
}
