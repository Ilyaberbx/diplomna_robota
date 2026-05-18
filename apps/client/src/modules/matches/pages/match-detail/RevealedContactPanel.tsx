import { useI18n } from '@/modules/shared/providers/i18n';
import type { TKey } from '@/modules/shared/providers/i18n';
import type { OwnerReport } from '../../matches.types.js';
import styles from './match-detail-page.module.css';

function ContactBlock({
  heading,
  phone,
  email,
}: {
  heading: string;
  phone: string;
  email: string;
}) {
  return (
    <div>
      <h3>{heading}</h3>
      <p>{phone}</p>
      <p>{email}</p>
    </div>
  );
}

export function RevealedContactPanel({
  lostReport,
  foundReport,
}: {
  lostReport: OwnerReport;
  foundReport: OwnerReport;
}) {
  const { t } = useI18n();
  const block = (labelKey: 'reveal.lostReport' | 'reveal.foundReport', r: OwnerReport) => ({
    heading: `${t(labelKey)}: ${
      r.name ?? t(`species.${r.species}` as TKey)
    }`,
    phone: t('common.phone', { value: r.contactPhone ?? t('common.dash') }),
    email: t('common.email', { value: r.contactEmail ?? t('common.dash') }),
  });

  return (
    <section className={styles.reveal} aria-label={t('reveal.aria')}>
      <h2>{t('reveal.title')}</h2>
      <p className={styles.status}>{t('reveal.explain')}</p>
      <ContactBlock {...block('reveal.lostReport', lostReport)} />
      <ContactBlock {...block('reveal.foundReport', foundReport)} />
    </section>
  );
}
