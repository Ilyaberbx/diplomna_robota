import { useI18n } from '@/modules/shared/providers/i18n';
import { STATUS_DESCRIPTORS } from './status-pill.constants.js';
import type { StatusPillProps } from './status-pill.types.js';
import styles from './status-pill.module.css';

/**
 * The single status surface across the app: icon + label + color together
 * (never color alone — DESIGN.md / IA status contract). The label is
 * resolved through the i18n catalog (`status.<kind>`); `status` values map
 * 1:1 onto those keys, so the cast is invariant-safe.
 */
export function StatusPill({ status, className }: StatusPillProps) {
  const { t } = useI18n();
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
      {t(`status.${status}`)}
    </span>
  );
}
