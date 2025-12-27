import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-warm-200 dark:bg-warm-800 hover:bg-warm-300 dark:hover:bg-warm-700 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-warm-800 dark:text-warm-200" />
      ) : (
        <Moon className="h-5 w-5 text-warm-800 dark:text-warm-200" />
      )}
    </button>
  );
};
