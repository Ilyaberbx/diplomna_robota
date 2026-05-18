import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import { ReportPhoto } from '../../components/report-photo/index.js';
import { useReportRow } from './use-report-row.js';
import styles from './my-reports-page.module.css';
import type { ReportRowProps } from '../../reports.types.js';

export function ReportRow({ entry, onChangeStatus }: ReportRowProps) {
  const { actions, pending, errorMessage, run } = useReportRow(
    entry,
    onChangeStatus,
  );
  const { t } = useI18n();
  const { report, candidateCount } = entry;
  const showBadge = candidateCount !== null && candidateCount > 0;

  return (
    <li className={styles.card}>
      <Link to={`/reports/${report.id}`}>
        <ReportPhoto
          reportId={report.id}
          photoKey={report.photoKey}
          alt={report.name ?? report.species}
          variant="card"
        />
      </Link>
      <div className={styles.body}>
        <Link to={`/reports/${report.id}`}>
          <strong>{report.name ?? t(`species.${report.species}`)}</strong>
        </Link>
        <div className={styles.meta}>
          <span className={styles.tag}>{t(`status.${report.kind}`)}</span>
          <span className={styles.tag}>{t(`status.${report.status}`)}</span>
          {showBadge && (
            <Link
              className={`${styles.tag} ${styles.badge}`}
              to={`/reports/${report.id}/candidates`}
            >
              {t('row.candidate', {
                count: candidateCount ?? 0,
              })}
            </Link>
          )}
        </div>

        {actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action) => (
              <button
                key={action.target}
                type="button"
                disabled={pending}
                onClick={() => run(action.target)}
              >
                {t(action.labelKey)}
              </button>
            ))}
          </div>
        )}

        {errorMessage && (
          <p role="alert" className={styles.rowError}>
            {t(errorMessage)}
          </p>
        )}
      </div>
    </li>
  );
}
