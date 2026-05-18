import type { EmptyStateProps } from './empty-state.types.js';
import styles from './empty-state.module.css';

/** A designed empty surface — never a blank screen (brief hard constraint). */
export function EmptyState({ title, message, children }: EmptyStateProps) {
  return (
    <div className={styles.root} role="status">
      <span className={styles.mark} aria-hidden="true">
        🐾
      </span>
      <p className={styles.title}>{title}</p>
      {message ? <p className={styles.message}>{message}</p> : null}
      {children ? <div className={styles.action}>{children}</div> : null}
    </div>
  );
}
