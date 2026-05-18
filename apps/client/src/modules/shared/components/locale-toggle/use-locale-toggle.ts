import { useI18n } from '@/modules/shared/providers/i18n';
import type { Locale } from '@/modules/shared/providers/i18n';

export function useLocaleToggle(): {
  locale: Locale;
  nextLocale: Locale;
  /** Short label of the locale the button switches to (e.g. "УКР"). */
  nextLabel: string;
  ariaLabel: string;
  toggleLocale: () => void;
} {
  const { locale, setLocale, t } = useI18n();
  const nextLocale: Locale = locale === 'uk' ? 'en' : 'uk';
  return {
    locale,
    nextLocale,
    nextLabel: nextLocale === 'uk' ? t('locale.uk') : t('locale.en'),
    ariaLabel: t('locale.aria'),
    toggleLocale: () => setLocale(nextLocale),
  };
}
