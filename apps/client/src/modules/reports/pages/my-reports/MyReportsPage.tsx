import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import { ReportRow } from './ReportRow.js';
import { useMyReportsPage } from './use-my-reports-page.js';
import { MY_REPORTS_GROUP_LABEL_KEYS } from './my-reports-page.constants.js';
import styles from './my-reports-page.module.css';
import type { MyReportsGroupKey } from '../../reports.types.js';

const GROUP_ORDER: MyReportsGroupKey[] = ['active', 'recovered', 'closed'];

export function MyReportsPage() {
  const { state, onChangeStatus } = useMyReportsPage();
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <h1>{t('myReports.title')}</h1>

      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          {t('myReports.loading')}
        </p>
      )}

      {state.phase === 'empty' && (
        <p role="status" className={styles.status}>
          {t('myReports.emptyText')}{' '}
          <Link to="/report/new?kind=lost">
            {t('myReports.emptyLostLink')}
          </Link>
          {t('myReports.emptyOr')}
          <Link to="/report/new?kind=found">
            {t('myReports.emptyFoundLink')}
          </Link>
          {t('myReports.emptyPeriod')}
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          {t('myReports.error', { kind: state.error.kind })}
        </p>
      )}

      {state.phase === 'ready' &&
        GROUP_ORDER.map((key) => (
          <section key={key} className={styles.group}>
            <h2>{t(MY_REPORTS_GROUP_LABEL_KEYS[key])}</h2>
            {state.groups[key].length === 0 ? (
              <p className={styles.groupEmpty}>
                {t('myReports.groupEmpty')}
              </p>
            ) : (
              <ul className={styles.list}>
                {state.groups[key].map((entry) => (
                  <ReportRow
                    key={entry.report.id}
                    entry={entry}
                    onChangeStatus={onChangeStatus}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
    </main>
  );
}
