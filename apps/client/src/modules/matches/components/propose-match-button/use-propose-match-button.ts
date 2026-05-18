import { useState } from 'react';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { proposeMatch } from '../../api/propose-match.js';
import type { ProposeMatchInput, ProposeState } from '../../matches.types.js';

export function useProposeMatchButton(input: ProposeMatchInput): {
  state: ProposeState;
  propose: () => void;
} {
  const client = useApiClient();
  const [state, setState] = useState<ProposeState>({ phase: 'idle' });

  const propose = (): void => {
    setState({ phase: 'submitting' });
    void proposeMatch(client, input).match(
      (match) => setState({ phase: 'proposed', match }),
      (error) => setState({ phase: 'error', error }),
    );
  };

  return { state, propose };
}
