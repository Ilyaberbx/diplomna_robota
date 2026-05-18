import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import { useRegisterPage } from './use-register-page.js';
import styles from './register-page.module.css';

export function RegisterPage() {
  const {
    email,
    password,
    error,
    submitting,
    setEmail,
    setPassword,
    onSubmit,
  } = useRegisterPage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <h1>{t('register.title')}</h1>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label htmlFor="register-email">{t('register.email')}</label>
          <input
            id="register-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="register-password">
            {t('register.password')}
          </label>
          <input
            id="register-password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error ? (
          <p role="alert" className={styles.error}>
            {t(error)}
          </p>
        ) : null}
        <button type="submit" disabled={submitting}>
          {submitting
            ? t('register.submitting')
            : t('register.submit')}
        </button>
      </form>
      <p>
        {t('register.haveAccount')}{' '}
        <Link to="/login">{t('register.login')}</Link>
      </p>
    </main>
  );
}
