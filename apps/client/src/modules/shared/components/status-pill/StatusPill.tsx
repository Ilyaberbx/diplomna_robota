import { STATUS_DESCRIPTORS } from './status-pill.constants.js';
import type { StatusPillProps } from './status-pill.types.js';
import styles from './status-pill.module.css';

/**
 * The single status surface across the app: icon + label + color together
 * (never color alone — DESIGN.md / IA status contract).
 */
export function StatusPill({ status, className }: StatusPillProps) {
  const descriptor = STATUS_DESCRIPTORS[status];
  const rootClass = className ? `${styles.pill} ${className}` : styles.pill;

  return (
    <span className={rootClass} data-tone={descriptor.tone}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={descriptor.icon} />
      </svg>
      {descriptor.label}
    </span>
  );
}
