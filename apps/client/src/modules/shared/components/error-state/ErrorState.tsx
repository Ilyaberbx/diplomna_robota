import { useI18n } from '@/modules/shared/providers/i18n';
import type { ErrorStateProps } from './error-state.types.js';
import styles from './error-state.module.css';

/** Designed error surface for any failed async load. */
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useI18n();
  return (
    <div className={styles.root} role="alert">
      <p className={styles.title}>{title ?? t('errorState.defaultTitle')}</p>
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <button type="button" data-variant="secondary" onClick={onRetry}>
          {t('errorState.retry')}
        </button>
      ) : null}
    </div>
  );
}
