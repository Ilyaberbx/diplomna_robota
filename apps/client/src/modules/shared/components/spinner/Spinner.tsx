import { useI18n } from '@/modules/shared/providers/i18n';
import styles from './spinner.module.css';

/** Accessible loading indicator for any pending async surface. */
export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className={styles.root} role="status">
      <span className={styles.ring} aria-hidden="true" />
      <span>{label ?? t('spinner.default')}</span>
    </div>
  );
}
