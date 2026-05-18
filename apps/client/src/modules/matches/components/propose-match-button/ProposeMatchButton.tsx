import { Link } from 'react-router-dom';
import { useI18n } from '@/modules/shared/providers/i18n';
import { useProposeMatchButton } from './use-propose-match-button.js';
import type { ProposeMatchButtonProps } from './propose-match-button.types.js';
import styles from './propose-match-button.module.css';

export function ProposeMatchButton(props: ProposeMatchButtonProps) {
  const { state, propose } = useProposeMatchButton(props);
  const { t } = useI18n();

  if (state.phase === 'proposed')
    return (
      <p className={styles.proposed}>
        {t('propose.proposedPrefix')}
        <Link to={`/me/matches?reportId=${props.lostReportId}`}>
          {t('propose.viewIt')}
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
          ? t('propose.submitting')
          : t('propose.label')}
      </button>
      {state.phase === 'error' && (
        <p role="alert" className={styles.error}>
          {t('propose.error', { kind: state.error.kind })}
        </p>
      )}
    </div>
  );
}
