import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { getCandidates } from '../../api/get-candidates.js';
import type { CandidatesState } from '../../reports.types.js';

export function useCandidatesPage(): {
  reportId: string | undefined;
  state: CandidatesState;
} {
  const client = useApiClient();
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<CandidatesState>({ phase: 'loading' });

  useEffect(() => {
    if (!id) return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setState({ phase: 'loading' });
    });
    void getCandidates(client, id).match(
      (candidates) => {
        if (!active) return;
        const isEmpty = candidates.length === 0;
        setState(
          isEmpty ? { phase: 'empty' } : { phase: 'ready', candidates },
        );
      },
      (error) => {
        if (active) setState({ phase: 'error', error });
      },
    );
    return () => {
      active = false;
    };
  }, [client, id]);

  return { reportId: id, state };
}
