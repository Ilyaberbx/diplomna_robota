import { Link } from 'react-router-dom';
import { ReportRow } from './ReportRow.js';
import { useMyReportsPage } from './use-my-reports-page.js';
import { MY_REPORTS_GROUP_LABELS } from './my-reports-page.constants.js';
import styles from './my-reports-page.module.css';
import type { MyReportsGroupKey } from '../../reports.types.js';

const GROUP_ORDER: MyReportsGroupKey[] = ['active', 'recovered', 'closed'];

export function MyReportsPage() {
  const { state, onChangeStatus } = useMyReportsPage();

  return (
    <main className={styles.page}>
      <h1>My reports</h1>

      {state.phase === 'loading' && (
        <p role="status" className={styles.status}>
          Loading your reports…
        </p>
      )}

      {state.phase === 'empty' && (
        <p role="status" className={styles.status}>
          You haven&apos;t published any reports yet.{' '}
          <Link to="/report/new?kind=lost">Report a lost pet</Link> or{' '}
          <Link to="/report/new?kind=found">a found one</Link>.
        </p>
      )}

      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          Could not load your reports ({state.error.kind}).
        </p>
      )}

      {state.phase === 'ready' &&
        GROUP_ORDER.map((key) => (
          <section key={key} className={styles.group}>
            <h2>{MY_REPORTS_GROUP_LABELS[key]}</h2>
            {state.groups[key].length === 0 ? (
              <p className={styles.groupEmpty}>None.</p>
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
