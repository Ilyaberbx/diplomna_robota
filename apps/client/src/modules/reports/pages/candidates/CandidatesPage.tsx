import { Link } from 'react-router-dom';
import { ProposeMatchButton } from '@/modules/matches';
import { ReportPhoto } from '../../components/report-photo/index.js';
import { useCandidatesPage } from './use-candidates-page.js';
import styles from './candidates-page.module.css';

export function CandidatesPage() {
  const { reportId, state } = useCandidatesPage();

  return (
    <main className={styles.page}>
      {reportId && (
        <Link className={styles.back} to={`/reports/${reportId}`}>
          ← Back to the report
        </Link>
      )}
      <h1>Possible matches</h1>

      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          Looking for possible matches…
        </p>
      )}

      {state.phase === 'empty' && (
        <p role="status" className={styles.status}>
          No possible matches yet — we&apos;ll keep checking as new reports
          come in.
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          Could not load candidates ({state.error.kind}).
        </p>
      )}

      {state.phase === 'ready' && (
        <ul className={styles.list}>
          {state.candidates.map((candidate) => (
            <li key={candidate.report.id} className={styles.card}>
              <Link to={`/reports/${candidate.report.id}`}>
                <ReportPhoto
                  reportId={candidate.report.id}
                  photoKey={candidate.report.photoKey}
                  alt={candidate.report.name ?? candidate.report.species}
                  variant="card"
                />
              </Link>
              <div>
                <Link to={`/reports/${candidate.report.id}`}>
                  <strong>
                    {candidate.report.name ?? candidate.report.species}
                  </strong>
                </Link>
                <div className={styles.signal}>
                  <span
                    className={
                      candidate.speciesMatch
                        ? `${styles.tag} ${styles.tagMatch}`
                        : styles.tag
                    }
                  >
                    {candidate.speciesMatch
                      ? `Same species (${candidate.report.species})`
                      : `Different species (${candidate.report.species})`}
                  </span>
                  <span className={styles.tag}>
                    {candidate.distanceKm < 1
                      ? 'Under 1 km away'
                      : `${candidate.distanceKm.toFixed(1)} km away`}
                  </span>
                  <span className={styles.tag}>
                    {candidate.daysApart === 0
                      ? 'Same day'
                      : `${candidate.daysApart} day(s) apart`}
                  </span>
                </div>
                {reportId && (
                  <ProposeMatchButton
                    lostReportId={
                      candidate.report.kind === 'found'
                        ? reportId
                        : candidate.report.id
                    }
                    foundReportId={
                      candidate.report.kind === 'found'
                        ? candidate.report.id
                        : reportId
                    }
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
