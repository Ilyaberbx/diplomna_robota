import { Link } from 'react-router-dom';
import { ProposeMatchButton } from '@/modules/matches';
import { useI18n } from '@/modules/shared/providers/i18n';
import { ReportPhoto } from '../../components/report-photo/index.js';
import { useCandidatesPage } from './use-candidates-page.js';
import styles from './candidates-page.module.css';

export function CandidatesPage() {
  const { reportId, state } = useCandidatesPage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      {reportId && (
        <Link className={styles.back} to={`/reports/${reportId}`}>
          {t('candidates.back')}
        </Link>
      )}
      <h1>{t('candidates.title')}</h1>

      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          {t('candidates.loading')}
        </p>
      )}

      {state.phase === 'empty' && (
        <p role="status" className={styles.status}>
          {t('candidates.empty')}
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          {t('candidates.error', { kind: state.error.kind })}
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
                    {candidate.report.name ??
                      t(`species.${candidate.report.species}`)}
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
                      ? t('candidates.sameSpecies', {
                          species: t(`species.${candidate.report.species}`),
                        })
                      : t('candidates.differentSpecies', {
                          species: t(`species.${candidate.report.species}`),
                        })}
                  </span>
                  <span className={styles.tag}>
                    {candidate.distanceKm < 1
                      ? t('candidates.underOneKm')
                      : t('candidates.kmAway', {
                          km: candidate.distanceKm.toFixed(1),
                        })}
                  </span>
                  <span className={styles.tag}>
                    {candidate.daysApart === 0
                      ? t('candidates.sameDay')
                      : t('candidates.daysApart', {
                          days: candidate.daysApart,
                          count: candidate.daysApart,
                        })}
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
