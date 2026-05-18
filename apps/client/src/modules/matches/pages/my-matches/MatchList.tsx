import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import type { MatchView } from '../../matches.types.js';
import styles from './my-matches-page.module.css';

export function MatchList({
  matches,
  reportId,
}: {
  matches: MatchView[];
  reportId: string;
}) {
  const { t } = useI18n();

  if (matches.length === 0)
    return <p className={styles.status}>{t('matchList.empty')}</p>;

  return (
    <ul className={styles.list}>
      {matches.map((match) => (
        <li key={match.id} className={styles.card}>
          <Link to={`/matches/${match.id}?reportId=${reportId}`}>
            {t('matchList.row', {
              lost: match.lostReportId.slice(0, 8),
              found: match.foundReportId.slice(0, 8),
              status: t(`status.${match.status}`),
            })}
          </Link>
        </li>
      ))}
    </ul>
  );
}
