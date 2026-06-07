'use client';
/**
 * ThemeToggle — tombol toggle dark/light/system
 * Tiga state: light → dark → system, dengan icon yang berubah.
 */

import { useTheme } from '@/lib/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  /** 'icon' = hanya ikon, 'full' = ikon + label (untuk settings page) */
  variant?: 'icon' | 'full';
  className?: string;
}

export default function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, resolved, setTheme } = useTheme();

  const cycle = () => {
    if (theme === 'light')  setTheme('dark');
    else if (theme === 'dark')  setTheme('system');
    else setTheme('light');
  };

  const icon = theme === 'dark'
    ? <Moon   size={16} className="text-indigo-400" />
    : theme === 'light'
    ? <Sun    size={16} className="text-amber-500" />
    : <Monitor size={16} className="text-gray-400" />;

  const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

  if (variant === 'full') {
    return (
      <button
        onClick={cycle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-[--border-color] bg-[--bg-card] hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium transition-colors ${className}`}
        title={`Mode: ${label}`}
      >
        {icon}
        <span className="text-[--text-primary]">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={cycle}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${className}`}
      title={`Mode: ${label} (klik untuk ganti)`}
    >
      {icon}
    </button>
  );
}
