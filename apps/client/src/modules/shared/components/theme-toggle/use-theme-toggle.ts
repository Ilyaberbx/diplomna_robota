import { useTheme } from '@/modules/shared/providers/theme';
import type { Theme } from '@/modules/shared/providers/theme/theme.types';

export function useThemeToggle(): {
  theme: Theme;
  isDark: boolean;
  nextLabel: string;
  toggleTheme: () => void;
} {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return {
    theme,
    isDark,
    nextLabel: isDark ? 'Switch to light theme' : 'Switch to dark theme',
    toggleTheme,
  };
}
