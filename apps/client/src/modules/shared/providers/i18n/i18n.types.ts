import type { en } from './catalogs/en.js';

export type Locale = 'uk' | 'en';

/** Every translation key. `en` is the canonical key set. */
export type TKey = keyof typeof en;

/** Interpolation params; `count` additionally drives plural selection. */
export type TParams = Record<string, string | number>;

export type TranslateFn = (key: TKey, params?: TParams) => string;

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
};
