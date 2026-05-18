import { en } from './catalogs/en.js';
import { uk } from './catalogs/uk.js';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
} from './i18n.constants.js';
import type { Locale, TKey, TParams } from './i18n.types.js';

const CATALOGS: Record<Locale, Record<TKey, string>> = { en, uk };

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly string[]).includes(value as string);
}

/** Persisted choice → browser language (uk*) → DEFAULT_LOCALE. */
export function detectLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) return stored;
  const nav =
    typeof navigator !== 'undefined' ? navigator.language : undefined;
  const isUkrainianBrowser = nav?.toLowerCase().startsWith('uk') ?? false;
  if (isUkrainianBrowser) return 'uk';
  return DEFAULT_LOCALE;
}

function readStoredLocale(): Locale | null {
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Private mode / disabled storage — choice simply does not persist.
  }
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    return value === undefined ? whole : String(value);
  });
}

/**
 * Resolve `key` for `locale`, applying plural category selection when a
 * numeric `count` is present (`${key}.${category}` → falls back to `key`).
 * Missing keys fall back to the English catalog, then to the key itself.
 */
export function translate(
  locale: Locale,
  key: TKey,
  params?: TParams,
): string {
  const catalog = CATALOGS[locale];
  const count = params?.count;
  const hasCount = typeof count === 'number';

  const pluralKey = hasCount
    ? (`${key}.${new Intl.PluralRules(locale).select(count)}` as TKey)
    : key;

  const template =
    catalog[pluralKey] ?? catalog[key] ?? en[key] ?? (key as string);
  return interpolate(template, params);
}
