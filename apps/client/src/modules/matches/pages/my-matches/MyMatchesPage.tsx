import { MatchList } from './MatchList.js';
import { useMyMatchesPage } from './use-my-matches-page.js';
import styles from './my-matches-page.module.css';

export function MyMatchesPage() {
  const { reportId, state } = useMyMatchesPage();

  return (
    <main className={styles.page}>
      <h1>My matches</h1>

      {!reportId && (
        <p role="status" className={styles.status}>
          Open this from a report to see its matches.
        </p>
      )}

      {state.phase === 'loading' && reportId && (
        <p role="status" className={styles.status}>
          Loading matches…
        </p>
      )}

      {state.phase === 'empty' && (
        <p role="status" className={styles.status}>
          No matches for this report yet.
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          Could not load matches ({state.error.kind}).
        </p>
      )}

      {state.phase === 'ready' && reportId && (
        <>
          <section className={styles.section}>
            <h2>Awaiting your decision</h2>
            <MatchList
              matches={state.awaitingYourDecision}
              reportId={reportId}
            />
          </section>
          <section className={styles.section}>
            <h2>Awaiting the other party</h2>
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
