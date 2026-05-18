import { useI18n } from '@/modules/shared/providers/i18n';
import { useTheme } from '@/modules/shared/providers/theme';
import type { Theme } from '@/modules/shared/providers/theme/theme.types';

export function useThemeToggle(): {
  theme: Theme;
  isDark: boolean;
  nextLabel: string;
  toggleTheme: () => void;
} {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === 'dark';
  return {
    theme,
    isDark,
    nextLabel: isDark ? t('theme.toLight') : t('theme.toDark'),
    toggleTheme,
  };
}
