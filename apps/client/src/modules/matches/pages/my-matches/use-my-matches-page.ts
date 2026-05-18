import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { useAuthSession } from '@/modules/auth';
import { listMatches } from '../../api/list-matches.js';
import type { MatchView, MyMatchesState } from '../../matches.types.js';

function splitByDecider(
  matches: MatchView[],
  userId: string,
): { awaitingYourDecision: MatchView[]; awaitingOtherParty: MatchView[] } {
  const pending = matches.filter((m) => m.status === 'proposed');
  const youProposed = (m: MatchView): boolean => m.proposedBy === userId;
  return {
    awaitingYourDecision: pending.filter((m) => !youProposed(m)),
    awaitingOtherParty: pending.filter(youProposed),
  };
}

export function useMyMatchesPage(): {
  reportId: string | null;
  state: MyMatchesState;
} {
  const client = useApiClient();
  const { session } = useAuthSession();
  const [params] = useSearchParams();
  const reportId = params.get('reportId');
  const [state, setState] = useState<MyMatchesState>({ phase: 'loading' });

  const userId =
    session.phase === 'authenticated' ? session.user.id : null;

  useEffect(() => {
    const hasInputs = reportId !== null && userId !== null;
    if (!hasInputs) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setState({ phase: 'loading' });
    });
    void listMatches(client, reportId).match(
      (matches) => {
        if (!active) return;
        const isEmpty = matches.length === 0;
        if (isEmpty) {
          setState({ phase: 'empty' });
          return;
        }
        const split = splitByDecider(matches, userId);
        setState({ phase: 'ready', ...split });
      },
      (error) => {
        if (active) setState({ phase: 'error', error });
      },
    );
    return () => {
      active = false;
    };
  }, [client, reportId, userId]);

  return { reportId, state };
}
