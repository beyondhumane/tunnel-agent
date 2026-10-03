import { Check, ChevronDown, Languages } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LANGS, useI18n } from '@/lib/i18n';

export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.lang.label}: ${t.lang[lang]}`}
        title={t.lang.label}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-2.5 text-xs font-semibold text-muted transition-colors hover:text-fg"
      >
        <Languages className="size-3.5" />
        <span className="font-mono uppercase">{lang}</span>
        <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t.lang.label}
          className="animate-rise absolute right-0 z-50 mt-2 min-w-36 rounded-xl border border-line bg-card p-1 shadow-xl shadow-black/10"
        >
          {LANGS.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={lang === l}
                lang={l}
                onClick={() => {
                  setLang(l);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                  lang === l ? 'bg-accent-soft text-accent' : 'text-fg hover:bg-side'
                }`}
              >
                <span className="w-5 font-mono text-[11px] font-semibold uppercase text-muted">{l}</span>
                <span className="flex-1">{t.lang[l]}</span>
                {lang === l && <Check className="size-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
