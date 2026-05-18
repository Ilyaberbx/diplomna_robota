import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { I18nContext } from './i18n.context.js';
import { detectLocale, persistLocale, translate } from './i18n.utils.js';
import type { Locale, TKey, TParams } from './i18n.types.js';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: TKey, params?: TParams) => translate(locale, key, params),
    }),
    [locale, setLocale],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}
