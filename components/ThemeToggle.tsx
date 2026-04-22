'use client';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, type Theme } from './ThemeProvider';

const OPTIONS: Array<{ key: Theme; label: string; Icon: any }> = [
  { key: 'light',  label: 'Clair',    Icon: Sun },
  { key: 'dark',   label: 'Sombre',   Icon: Moon },
  { key: 'system', label: 'Système',  Icon: Monitor },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10 gap-1" role="radiogroup" aria-label="Choix du thème">
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              active
                ? 'bg-lilac text-ink shadow'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Variant compact pour la nav (un seul bouton qui cycle) */
export function ThemeToggleCompact() {
  const { theme, resolved, setTheme } = useTheme();

  const next = () => {
    // Cycle simple : light → dark → system → light…
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const Icon = theme === 'system' ? Monitor : resolved === 'light' ? Sun : Moon;
  const label = theme === 'system' ? 'Système' : resolved === 'light' ? 'Clair' : 'Sombre';

  return (
    <button
      type="button"
      onClick={next}
      title={`Thème : ${label} (clic pour changer)`}
      aria-label={`Thème actuel : ${label}. Cliquer pour changer.`}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
    >
      <Icon size={16} />
    </button>
  );
}
