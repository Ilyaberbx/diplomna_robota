import { RevealedContactPanel } from './RevealedContactPanel.js';
import { useMatchDetailPage } from './use-match-detail-page.js';
import styles from './match-detail-page.module.css';

export function MatchDetailPage() {
  const { state, confirm, reject } = useMatchDetailPage();

  return (
    <main className={styles.page}>
      <h1>Match</h1>

      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          Loading match…
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          Could not load this match ({state.error.kind}).
        </p>
      )}

      {state.phase === 'ready' && (
        <section>
          <p>
            Status: <strong>{state.match.status}</strong>
          </p>
          {state.match.status === 'proposed' && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.confirm}
                onClick={confirm}
              >
                Confirm match
              </button>
              <button
                type="button"
                className={styles.reject}
                onClick={reject}
              >
                Reject match
              </button>
            </div>
          )}
          {state.match.status === 'rejected' && (
            <p className={styles.status}>This match was rejected.</p>
          )}
        </section>
      )}

      {state.phase === 'confirmed' && (
        <section>
          <p>
            Status: <strong>confirmed</strong>
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
