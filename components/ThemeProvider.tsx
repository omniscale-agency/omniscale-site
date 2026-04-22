'use client';
// Theme system : light / dark / system. Persisté en localStorage.
// Applique data-theme="dark" ou "light" sur <html>. Les CSS overrides dans globals.css
// font le mapping des classes Tailwind dark-only vers leurs équivalents clairs.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'omniscale_theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolved, setResolved] = useState<ResolvedTheme>('dark');

  // Init au mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stored: Theme = 'dark';
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark' || v === 'system') stored = v;
    } catch { /* localStorage may be blocked */ }
    setThemeState(stored);
    const r = stored === 'system' ? getSystemTheme() : stored;
    setResolved(r);
    applyTheme(r);
  }, []);

  // Réagit au changement de prefers-color-scheme si theme === 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      const r = getSystemTheme();
      setResolved(r);
      applyTheme(r);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
    const r = t === 'system' ? getSystemTheme() : t;
    setResolved(r);
    applyTheme(r);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback : si utilisé hors du provider, retourne dark par défaut
    return { theme: 'dark' as Theme, resolved: 'dark' as ResolvedTheme, setTheme: () => {} };
  }
  return ctx;
}

/** Script à inline dans <head> pour éviter le flash blanc au load (FOUC) */
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var v = localStorage.getItem('omniscale_theme');
    var r = v === 'light' ? 'light' : (v === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : 'dark');
    document.documentElement.setAttribute('data-theme', r);
    document.documentElement.style.colorScheme = r;
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`.trim();
