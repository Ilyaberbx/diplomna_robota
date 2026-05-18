import { useHealthPage } from './use-health-page.js';
import styles from './health-page.module.css';

export function HealthPage() {
  const { state, theme, toggleTheme } = useHealthPage();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>PetFinder</h1>
        {state.phase === 'loading' && (
          <p className={styles.loading} role="status">
            Checking connection…
          </p>
        )}
        {state.phase === 'ok' && (
          <p className={styles.ok} role="status">
            API reachable — status ok
          </p>
        )}
        {state.phase === 'error' && (
          <p className={styles.error} role="alert">
            API unreachable ({state.error.kind})
          </p>
        )}
      </section>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        Theme: {theme}
      </button>
    </main>
  );
}
