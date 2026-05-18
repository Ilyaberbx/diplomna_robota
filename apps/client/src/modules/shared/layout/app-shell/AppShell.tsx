import { Link, NavLink, Outlet } from 'react-router-dom';
import { LocaleToggle } from '@/modules/shared/components/locale-toggle';
import { ThemeToggle } from '@/modules/shared/components/theme-toggle';
import { useI18n } from '@/modules/shared/providers/i18n';
import type { AppShellProps } from './app-shell.types.js';
import styles from './app-shell.module.css';

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.link} ${styles.linkActive}` : styles.link;
}

function mobileClass({ isActive }: { isActive: boolean }): string {
  return isActive
    ? `${styles.mobileLink} ${styles.mobileLinkActive}`
    : styles.mobileLink;
}

/**
 * Persistent app chrome (IA "Global navigation"): sticky top bar on desktop,
 * thumb-reachable bottom action bar on mobile. Dumb — auth state and the
 * logout handler are wired by the composition root (`app/AppShell`).
 */
export function AppShell({ userEmail, isLoading, onLogout }: AppShellProps) {
  const { t } = useI18n();
  const isAuthed = userEmail !== null;
  const showAnonActions = !isLoading && !isAuthed;
  const showAuthedActions = !isLoading && isAuthed;

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            🐾
          </span>
          {t('nav.brand')}
        </Link>

        <nav className={styles.nav} aria-label={t('nav.primaryAria')}>
          <NavLink to="/browse" className={navClass}>
            {t('nav.browse')}
          </NavLink>
          <Link to="/report/new?kind=lost" className={styles.cta}>
            {t('nav.reportPet')}
          </Link>
        </nav>

        <span className={styles.spacer} />

        <div className={styles.actions}>
          <LocaleToggle />
          <ThemeToggle />
          {showAuthedActions ? (
            <>
              <NavLink
                to="/me/reports"
                className={`${navClass({ isActive: false })} ${styles.desktopOnly}`}
              >
                {t('nav.myReports')}
              </NavLink>
              <Link
                to="/me"
                className={`${styles.email} ${styles.desktopOnly}`}
                title={userEmail ?? undefined}
              >
                {userEmail}
              </Link>
              <button
                type="button"
                className={styles.logout}
                onClick={onLogout}
              >
                {t('nav.logout')}
              </button>
            </>
          ) : null}
          {showAnonActions ? (
            <Link to="/login" className={styles.cta}>
              {t('nav.login')}
            </Link>
          ) : null}
        </div>
      </header>

      <main className={styles.content}>
        <Outlet />
      </main>

      <nav className={styles.mobileBar} aria-label={t('nav.primaryAria')}>
        <NavLink to="/browse" className={mobileClass} end>
          {t('nav.browse')}
        </NavLink>
        <Link
          to="/report/new?kind=lost"
          className={`${styles.mobileLink} ${styles.mobileCta}`}
        >
          {t('nav.reportPet')}
        </Link>
        {isAuthed ? (
          <NavLink to="/me/reports" className={mobileClass}>
            {t('nav.myReports')}
          </NavLink>
        ) : (
          <NavLink to="/login" className={mobileClass}>
            {t('nav.login')}
          </NavLink>
        )}
      </nav>
    </div>
  );
}
