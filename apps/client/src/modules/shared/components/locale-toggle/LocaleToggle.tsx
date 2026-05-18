import { useLocaleToggle } from './use-locale-toggle.js';
import styles from './locale-toggle.module.css';

export function LocaleToggle() {
  const { nextLabel, ariaLabel, toggleLocale } = useLocaleToggle();

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleLocale}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {nextLabel}
    </button>
  );
}
