import styles from './spinner.module.css';

/** Accessible loading indicator for any pending async surface. */
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className={styles.root} role="status">
      <span className={styles.ring} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
