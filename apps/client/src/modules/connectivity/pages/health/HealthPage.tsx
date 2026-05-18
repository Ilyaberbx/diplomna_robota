import { useI18n } from '@/modules/shared/providers/i18n';
import { useHealthPage } from './use-health-page.js';
import styles from './health-page.module.css';

export function HealthPage() {
  const { state, theme, toggleTheme } = useHealthPage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{t('health.title')}</h1>
        {state.phase === 'loading' && (
          <p className={styles.loading} role="status">
            {t('health.loading')}
          </p>
        )}
        {state.phase === 'ok' && (
          <p className={styles.ok} role="status">
            {t('health.ok')}
          </p>
        )}
        {state.phase === 'error' && (
          <p className={styles.error} role="alert">
            {t('health.error', { kind: state.error.kind })}
          </p>
        )}
      </section>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggleTheme}
        aria-label={t('health.toggleAria')}
      >
        {t('health.theme', { theme })}
      </button>
    </main>
  );
}
