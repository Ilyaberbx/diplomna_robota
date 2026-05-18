import { Link } from 'react-router-dom';
import { ReportPhoto } from '../../components/report-photo/index.js';
import { useReportDetailPage } from './use-report-detail-page.js';
import styles from './report-detail-page.module.css';

export function ReportDetailPage() {
  const { state } = useReportDetailPage();

  return (
    <main className={styles.page}>
      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          Loading report…
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          Could not load this report ({state.error.kind}).
        </p>
      )}

      {state.phase === 'ready' && (
        <article>
          <span className={styles.badge}>
            {state.report.kind === 'lost' ? 'Lost' : 'Found'} ·{' '}
            {state.report.status}
          </span>
          <h1>{state.report.name ?? state.report.species}</h1>
          <ReportPhoto
            reportId={state.report.id}
            photoKey={state.report.photoKey}
            alt={state.report.name ?? state.report.species}
            variant="detail"
          />
          <dl className={styles.facts}>
            <dt>Species</dt>
            <dd>{state.report.species}</dd>
            <dt>Breed</dt>
            <dd>{state.report.breed ?? '—'}</dd>
            <dt>Color</dt>
            <dd>{state.report.color ?? '—'}</dd>
            <dt>Description</dt>
            <dd>{state.report.description ?? '—'}</dd>
            <dt>Last seen / found</dt>
            <dd>
              {state.report.lat.toFixed(4)}, {state.report.lng.toFixed(4)} on{' '}
              {state.report.eventDate.slice(0, 10)}
            </dd>
          </dl>

          {state.report.viewer === 'owner' ? (
            <section className={styles.contact} aria-label="Contact details">
              <h2>Your contact details</h2>
              <p>Phone: {state.report.contactPhone ?? '—'}</p>
              <p>Email: {state.report.contactEmail ?? '—'}</p>
              <Link to={`/reports/${state.report.id}/candidates`}>
                View candidates
              </Link>
            </section>
          ) : (
            <p className={styles.privacy}>
              Contact details are hidden until a match is confirmed.
            </p>
          )}
        </article>
      )}
    </main>
  );
}
