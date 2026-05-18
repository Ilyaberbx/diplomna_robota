import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import styles from './not-found-page.module.css';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <main className={styles.page}>
      <p className={styles.code}>{t('notFound.code')}</p>
      <h1 className={styles.title}>{t('notFound.title')}</h1>
      <p className={styles.message}>{t('notFound.message')}</p>
      <Link to="/" className={styles.home}>
        {t('notFound.home')}
      </Link>
    </main>
  );
}
