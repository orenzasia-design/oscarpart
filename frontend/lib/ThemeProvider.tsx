'use client';
/**
 * ThemeProvider — context untuk dark/light mode toggle
 * Menyimpan preferensi di localStorage dan sync dengan system preference.
 * Menambahkan/menghapus class 'dark' di <html> element.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme:     Theme;
  resolved:  'light' | 'dark'; // actual value setelah resolve system
  setTheme:  (t: Theme) => void;
  toggle:    () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:    'system',
  resolved: 'light',
  setTheme: () => {},
  toggle:   () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState]     = useState<Theme>('system');
  const [resolved, setResolved]    = useState<'light' | 'dark'>('light');
  const [mounted, setMounted]      = useState(false);

  // On mount — read from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    setThemeState(stored ?? 'system');
    setMounted(true);
  }, []);

  // Apply class to <html> whenever theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const mq   = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(t: Theme) {
      const isDark = t === 'dark' || (t === 'system' && mq.matches);
      root.classList.toggle('dark', isDark);
      setResolved(isDark ? 'dark' : 'light');
    }

    applyTheme(theme);

    // Listen to system preference changes (when theme = 'system')
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, mounted]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('theme', t);
  }

  function toggle() {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }

  // Avoid flash of wrong theme — render children after mount
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
