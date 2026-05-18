import { useContext } from 'react';
import { I18nContext } from './i18n.context.js';
import type { I18nContextValue } from './i18n.types.js';

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
