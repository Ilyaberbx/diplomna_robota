import { useEffect, useState } from 'react';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { useTheme } from '@/modules/shared/providers/theme';
import { getHealth } from '../../api/get-health.js';
import type { ConnectivityState } from '../../connectivity.types.js';

export function useHealthPage(): {
  state: ConnectivityState;
  theme: string;
  toggleTheme: () => void;
} {
  const client = useApiClient();
  const { theme, toggleTheme } = useTheme();
  const [state, setState] = useState<ConnectivityState>({ phase: 'loading' });

  useEffect(() => {
    let active = true;
    void getHealth(client).match(
      () => {
        if (active) setState({ phase: 'ok' });
      },
      (error) => {
        if (active) setState({ phase: 'error', error });
      },
    );
    return () => {
      active = false;
    };
  }, [client]);

  return { state, theme, toggleTheme };
}
