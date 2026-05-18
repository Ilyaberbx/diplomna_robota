import { Link } from 'react-router-dom';
import { EmptyState } from '@/modules/shared/components/empty-state';
import { ErrorState } from '@/modules/shared/components/error-state';
import { Spinner } from '@/modules/shared/components/spinner';
import { StatusPill } from '@/modules/shared/components/status-pill';
import { ReportPhoto } from '../../components/report-photo/index.js';
import { useLandingPage } from './use-landing-page.js';
import styles from './landing-page.module.css';

export function LandingPage() {
  const { state } = useLandingPage();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>PetFinder</p>
        <h1 className={styles.title}>
          Lost a pet? Found one? Let&apos;s get them home.
        </h1>
        <p className={styles.lede}>
          Publish a report in under a minute. We watch for matches nearby and
          only reveal contact details once both sides confirm.
        </p>
        <div className={styles.ctaRow}>
          <Link
            to="/report/new?kind=lost"
            className={`${styles.cta} ${styles.ctaLost}`}
          >
            <span className={styles.ctaTitle}>I lost a pet</span>
            <span className={styles.ctaSub}>
              File a Lost Report and start watching for matches
            </span>
          </Link>
          <Link
            to="/report/new?kind=found"
            className={`${styles.cta} ${styles.ctaFound}`}
          >
            <span className={styles.ctaTitle}>I found a pet</span>
            <span className={styles.ctaSub}>
              File a Found Report so the owner can find you
            </span>
          </Link>
        </div>
      </section>

      <section className={styles.feed}>
        <div className={styles.feedHead}>
          <h2>Active near you</h2>
          <Link to="/browse">Browse all reports →</Link>
        </div>

        {state.phase === 'loading' && <Spinner label="Loading reports…" />}

        {state.phase === 'error' && (
          <ErrorState
            message={`We couldn't load reports right now (${state.error.kind}).`}
          />
        )}

        {state.phase === 'empty' && (
          <EmptyState
            title="No active reports yet"
            message="Be the first — file a report and we'll watch for matches as new ones come in."
          >
            <Link to="/report/new?kind=lost" className={styles.cardName}>
              Report a pet
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
                      {report.name ?? report.species}
                    </span>
                    <span className={styles.cardMeta}>
                      {report.species}
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
