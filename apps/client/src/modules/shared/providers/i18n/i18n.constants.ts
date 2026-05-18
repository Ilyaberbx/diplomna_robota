import type { Locale } from './i18n.types.js';

/** Persisted locale choice. Seeded by the thesis screenshot script too. */
export const LOCALE_STORAGE_KEY = 'petfinder.locale';

/** Fallback when nothing is persisted and the browser isn't Ukrainian. */
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALES = ['en', 'uk'] as const;
