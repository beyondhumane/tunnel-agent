import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import type { ThemePref } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

const OPTIONS: { value: ThemePref; Icon: typeof Sun }[] = [
  { value: 'light', Icon: Sun },
  { value: 'system', Icon: Monitor },
  { value: 'dark', Icon: Moon },
];

export function ThemeToggle() {
  const [pref, setPref] = useTheme();
  const { t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t.theme.label} className="inline-flex items-center rounded-full border border-line bg-card p-0.5">
      {OPTIONS.map(({ value, Icon }) => {
        const label = t.theme[value];
        return (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          aria-label={label}
          title={label}
          onClick={() => setPref(value)}
          className={`grid size-7 place-items-center rounded-full transition-colors ${
            pref === value ? 'bg-accent-soft text-accent' : 'text-muted hover:text-fg'
          }`}
        >
          <Icon className="size-3.5" />
        </button>
        );
      })}
    </div>
  );
}
