import type { ErrorStateProps } from './error-state.types.js';
import styles from './error-state.module.css';

/** Designed error surface for any failed async load. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.root} role="alert">
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <button type="button" data-variant="secondary" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
