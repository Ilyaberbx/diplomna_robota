import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import { useAccountPage } from './use-account-page.js';
import styles from './account-page.module.css';

export function AccountPage() {
  const { user, onLogout } = useAccountPage();
  const { t } = useI18n();
  const email = user ? user.email : t('account.unknown');
  const initial = email.charAt(0).toUpperCase();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{t('account.title')}</h1>

        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">
            {initial}
          </span>
          <div className={styles.who}>
            <p className={styles.label}>{t('account.signedInAs')}</p>
            <p className={styles.email}>{email}</p>
          </div>
        </div>

        <div className={styles.links}>
          <Link to="/me/reports" className={styles.link}>
            {t('account.myReports')}
          </Link>
          <Link to="/browse" className={styles.link}>
            {t('account.browseReports')}
          </Link>
        </div>

        <button
          type="button"
          data-variant="secondary"
          className={styles.logout}
          onClick={onLogout}
        >
          {t('account.logout')}
        </button>
      </section>
    </main>
  );
}
