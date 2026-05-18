import { useContext } from 'react';
import { ThemeContext } from './theme.context.js';
import type { ThemeContextValue } from './theme.types.js';

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
