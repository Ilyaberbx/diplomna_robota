import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { listMatches } from '../../api/list-matches.js';
import { confirmMatch, rejectMatch } from '../../api/decide-match.js';
import type { MatchDetailState } from '../../matches.types.js';

export function useMatchDetailPage(): {
  state: MatchDetailState;
  confirm: () => void;
  reject: () => void;
} {
  const client = useApiClient();
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const reportId = params.get('reportId');
  const [state, setState] = useState<MatchDetailState>({ phase: 'loading' });

  useEffect(() => {
    const hasInputs = id !== undefined && reportId !== null;
    if (!hasInputs) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setState({ phase: 'loading' });
    });
    void listMatches(client, reportId).match(
      (matches) => {
        if (!active) return;
        const match = matches.find((m) => m.id === id);
        if (!match) {
          setState({
            phase: 'error',
            error: { kind: 'parse', cause: 'match not found' },
          });
          return;
        }
        setState({ phase: 'ready', match });
      },
      (error) => {
        if (active) setState({ phase: 'error', error });
      },
    );
    return () => {
      active = false;
    };
  }, [client, id, reportId]);

  const confirm = (): void => {
    if (id === undefined) return;
    void confirmMatch(client, id).match(
      (match) => setState({ phase: 'confirmed', match }),
      (error) => setState({ phase: 'error', error }),
    );
  };

  const reject = (): void => {
    if (id === undefined) return;
    void rejectMatch(client, id).match(
      (match) => setState({ phase: 'ready', match }),
      (error) => setState({ phase: 'error', error }),
    );
  };

  return { state, confirm, reject };
}
