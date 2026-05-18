import { Link } from 'react-router-dom';
import { EmptyState } from '@/modules/shared/components/empty-state';
import { ErrorState } from '@/modules/shared/components/error-state';
import { Spinner } from '@/modules/shared/components/spinner';
import { StatusPill } from '@/modules/shared/components/status-pill';
import { useI18n } from '@/modules/shared/providers/i18n';
import { ReportPhoto } from '../../components/report-photo/index.js';
import { useLandingPage } from './use-landing-page.js';
import styles from './landing-page.module.css';

export function LandingPage() {
  const { state } = useLandingPage();
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>{t('landing.kicker')}</p>
        <h1 className={styles.title}>{t('landing.title')}</h1>
        <p className={styles.lede}>{t('landing.lede')}</p>
        <div className={styles.ctaRow}>
          <Link
            to="/report/new?kind=lost"
            className={`${styles.cta} ${styles.ctaLost}`}
          >
            <span className={styles.ctaTitle}>
              {t('landing.lostCtaTitle')}
            </span>
            <span className={styles.ctaSub}>{t('landing.lostCtaSub')}</span>
          </Link>
          <Link
            to="/report/new?kind=found"
            className={`${styles.cta} ${styles.ctaFound}`}
          >
            <span className={styles.ctaTitle}>
              {t('landing.foundCtaTitle')}
            </span>
            <span className={styles.ctaSub}>{t('landing.foundCtaSub')}</span>
          </Link>
        </div>
      </section>

      <section className={styles.feed}>
        <div className={styles.feedHead}>
          <h2>{t('landing.feedHead')}</h2>
          <Link to="/browse">{t('landing.browseAll')}</Link>
        </div>

        {state.phase === 'loading' && (
          <Spinner label={t('landing.loading')} />
        )}

        {state.phase === 'error' && (
          <ErrorState
            message={t('landing.error', { kind: state.error.kind })}
          />
        )}

        {state.phase === 'empty' && (
          <EmptyState
            title={t('landing.emptyTitle')}
            message={t('landing.emptyMessage')}
          >
            <Link to="/report/new?kind=lost" className={styles.cardName}>
              {t('landing.emptyCta')}
            </Link>
          </EmptyState>
        )}

        {state.phase === 'ready' && (
          <ul className={styles.grid}>
            {state.data.items.map((report) => (
              <li key={report.id} className={styles.card}>
                <Link
                  to={`/reports/${report.id}`}
                  className={styles.cardLink}
                >
                  <ReportPhoto
                    reportId={report.id}
                    photoKey={report.photoKey}
                    alt={report.name ?? report.species}
                    variant="card"
                  />
                  <div className={styles.cardBody}>
                    <div className={styles.pillRow}>
                      <StatusPill status={report.kind} />
                      <StatusPill status={report.status} />
                    </div>
                    <span className={styles.cardName}>
                      {report.name ?? t(`species.${report.species}`)}
                    </span>
                    <span className={styles.cardMeta}>
                      {t(`species.${report.species}`)}
                      {report.breed ? ` · ${report.breed}` : ''} ·{' '}
                      {report.eventDate.slice(0, 10)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
