import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import { useLoginPage } from './use-login-page.js';
import styles from './login-page.module.css';

export function LoginPage() {
  const {
    email,
    password,
    error,
    submitting,
    setEmail,
    setPassword,
    onSubmit,
  } = useLoginPage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <h1>{t('login.title')}</h1>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label htmlFor="login-email">{t('login.email')}</label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password">{t('login.password')}</label>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error ? (
          <p role="alert" className={styles.error}>
            {t(error)}
          </p>
        ) : null}
        <button type="submit" disabled={submitting}>
          {submitting ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
      <p>
        {t('login.noAccount')}{' '}
        <Link to="/register">{t('login.register')}</Link>
      </p>
    </main>
  );
}
