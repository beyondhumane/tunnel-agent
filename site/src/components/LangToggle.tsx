import { LANGS, useI18n } from '@/lib/i18n';

export function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t.lang.label} className="inline-flex items-center rounded-full border border-line bg-card p-0.5">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          aria-label={t.lang[l]}
          title={t.lang[l]}
          lang={l}
          onClick={() => setLang(l)}
          className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 font-mono text-[11px] font-semibold uppercase transition-colors ${
            lang === l ? 'bg-accent-soft text-accent' : 'text-muted hover:text-fg'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
