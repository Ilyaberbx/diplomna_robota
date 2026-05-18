import { useI18n } from '@/modules/shared/providers/i18n';
import { MatchList } from './MatchList.js';
import { useMyMatchesPage } from './use-my-matches-page.js';
import styles from './my-matches-page.module.css';

export function MyMatchesPage() {
  const { reportId, state } = useMyMatchesPage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <h1>{t('myMatches.title')}</h1>

      {!reportId && (
        <p role="status" className={styles.status}>
          {t('myMatches.openFromReport')}
        </p>
      )}

      {state.phase === 'loading' && reportId && (
        <p role="status" className={styles.status}>
          {t('myMatches.loading')}
        </p>
      )}

      {state.phase === 'empty' && (
        <p role="status" className={styles.status}>
          {t('myMatches.empty')}
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          {t('myMatches.error', { kind: state.error.kind })}
        </p>
      )}

      {state.phase === 'ready' && reportId && (
        <>
          <section className={styles.section}>
            <h2>{t('myMatches.awaitingYou')}</h2>
            <MatchList
              matches={state.awaitingYourDecision}
              reportId={reportId}
            />
          </section>
          <section className={styles.section}>
            <h2>{t('myMatches.awaitingOther')}</h2>
            <MatchList
              matches={state.awaitingOtherParty}
              reportId={reportId}
            />
          </section>
        </>
      )}
    </main>
  );
}
