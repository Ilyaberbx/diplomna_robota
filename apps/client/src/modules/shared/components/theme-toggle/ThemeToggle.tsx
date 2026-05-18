import { useThemeToggle } from './use-theme-toggle.js';
import styles from './theme-toggle.module.css';

const SUN =
  'M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6 4.5 4.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8';
const MOON = 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z';

export function ThemeToggle() {
  const { isDark, nextLabel, toggleTheme } = useThemeToggle();

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
    >
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
        <path d={isDark ? SUN : MOON} />
      </svg>
    </button>
  );
}
