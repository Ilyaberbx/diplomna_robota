import { createContext } from 'react';
import type { ThemeContextValue } from './theme.types.js';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
