import { Link } from 'react-router-dom';
import { useProposeMatchButton } from './use-propose-match-button.js';
import type { ProposeMatchButtonProps } from './propose-match-button.types.js';
import styles from './propose-match-button.module.css';

export function ProposeMatchButton(props: ProposeMatchButtonProps) {
  const { state, propose } = useProposeMatchButton(props);

  if (state.phase === 'proposed')
    return (
      <p className={styles.proposed}>
        Match proposed —{' '}
        <Link to={`/me/matches?reportId=${props.lostReportId}`}>
          view it
        </Link>
      </p>
    );

  return (
    <div>
      <button
        type="button"
        className={styles.button}
        onClick={propose}
        disabled={state.phase === 'submitting'}
      >
        {state.phase === 'submitting'
          ? 'Proposing…'
          : 'Propose a match'}
      </button>
      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          Could not propose this match ({state.error.kind}).
        </p>
      )}
    </div>
  );
}
