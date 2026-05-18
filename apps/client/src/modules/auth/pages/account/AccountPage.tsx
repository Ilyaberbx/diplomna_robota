import { Link } from 'react-router-dom';
import { useAccountPage } from './use-account-page.js';
import styles from './account-page.module.css';

export function AccountPage() {
  const { user, onLogout } = useAccountPage();
  const email = user ? user.email : 'unknown';
  const initial = email.charAt(0).toUpperCase();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Account</h1>

        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">
            {initial}
          </span>
          <div className={styles.who}>
            <p className={styles.label}>Signed in as</p>
            <p className={styles.email}>{email}</p>
          </div>
        </div>

        <div className={styles.links}>
          <Link to="/me/reports" className={styles.link}>
            My reports
          </Link>
          <Link to="/browse" className={styles.link}>
            Browse reports
          </Link>
        </div>

        <button
          type="button"
          data-variant="secondary"
          className={styles.logout}
          onClick={onLogout}
        >
          Log out
        </button>
      </section>
    </main>
  );
}
