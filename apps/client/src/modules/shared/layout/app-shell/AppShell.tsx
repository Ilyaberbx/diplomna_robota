import { Link, NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/modules/shared/components/theme-toggle';
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
          PetFinder
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <NavLink to="/browse" className={navClass}>
            Browse
          </NavLink>
          <Link to="/report/new?kind=lost" className={styles.cta}>
            Report a pet
          </Link>
        </nav>

        <span className={styles.spacer} />

        <div className={styles.actions}>
          <ThemeToggle />
          {showAuthedActions ? (
            <>
              <NavLink
                to="/me/reports"
                className={`${navClass({ isActive: false })} ${styles.desktopOnly}`}
              >
                My reports
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
                Log out
              </button>
            </>
          ) : null}
          {showAnonActions ? (
            <Link to="/login" className={styles.cta}>
              Log in
            </Link>
          ) : null}
        </div>
      </header>

      <main className={styles.content}>
        <Outlet />
      </main>

      <nav className={styles.mobileBar} aria-label="Primary">
        <NavLink to="/browse" className={mobileClass} end>
          Browse
        </NavLink>
        <Link
          to="/report/new?kind=lost"
          className={`${styles.mobileLink} ${styles.mobileCta}`}
        >
          Report a pet
        </Link>
        {isAuthed ? (
          <NavLink to="/me/reports" className={mobileClass}>
            My reports
          </NavLink>
        ) : (
          <NavLink to="/login" className={mobileClass}>
            Log in
          </NavLink>
        )}
      </nav>
    </div>
  );
}
