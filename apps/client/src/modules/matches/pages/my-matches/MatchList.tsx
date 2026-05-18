import { Link } from 'react-router-dom';
import type { MatchView } from '../../matches.types.js';
import styles from './my-matches-page.module.css';

export function MatchList({
  matches,
  reportId,
}: {
  matches: MatchView[];
  reportId: string;
}) {
  if (matches.length === 0)
    return <p className={styles.status}>Nothing here.</p>;

  return (
    <ul className={styles.list}>
      {matches.map((match) => (
        <li key={match.id} className={styles.card}>
          <Link to={`/matches/${match.id}?reportId=${reportId}`}>
            Lost {match.lostReportId.slice(0, 8)} ↔ Found{' '}
            {match.foundReportId.slice(0, 8)} — {match.status}
          </Link>
        </li>
      ))}
    </ul>
  );
}
