import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import type { ThemePref } from '@/lib/theme';

const OPTIONS: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export function ThemeToggle() {
  const [pref, setPref] = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex items-center rounded-full border border-line bg-card p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => (
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
      ))}
    </div>
  );
}
