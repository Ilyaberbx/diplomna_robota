import { Link } from 'react-router-dom';
import styles from './not-found-page.module.css';

export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>This page wandered off</h1>
      <p className={styles.message}>
        The page you&apos;re looking for doesn&apos;t exist or has moved.
        Let&apos;s get you back on track.
      </p>
      <Link to="/" className={styles.home}>
        Back to home
      </Link>
    </main>
  );
}
