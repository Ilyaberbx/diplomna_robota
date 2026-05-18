import { useI18n } from '@/modules/shared/providers/i18n';
import { RevealedContactPanel } from './RevealedContactPanel.js';
import { useMatchDetailPage } from './use-match-detail-page.js';
import styles from './match-detail-page.module.css';

export function MatchDetailPage() {
  const { state, confirm, reject } = useMatchDetailPage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <h1>{t('matchDetail.title')}</h1>

      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          {t('matchDetail.loading')}
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          {t('matchDetail.error', { kind: state.error.kind })}
        </p>
      )}

      {state.phase === 'ready' && (
        <section>
          <p>
            {t('matchDetail.statusLabel')}{' '}
            <strong>{t(`status.${state.match.status}`)}</strong>
          </p>
          {state.match.status === 'proposed' && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.confirm}
                onClick={confirm}
              >
                {t('matchDetail.confirm')}
              </button>
              <button
                type="button"
                className={styles.reject}
                onClick={reject}
              >
                {t('matchDetail.reject')}
              </button>
            </div>
          )}
          {state.match.status === 'rejected' && (
            <p className={styles.status}>{t('matchDetail.rejected')}</p>
          )}
        </section>
      )}

      {state.phase === 'confirmed' && (
        <section>
          <p>
            {t('matchDetail.statusLabel')}{' '}
            <strong>{t('status.confirmed')}</strong>
          </p>
          <RevealedContactPanel
            lostReport={state.match.lostReport}
            foundReport={state.match.foundReport}
          />
        </section>
      )}
    </main>
  );
}
