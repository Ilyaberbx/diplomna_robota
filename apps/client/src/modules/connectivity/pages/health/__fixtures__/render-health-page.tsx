import type { ReactElement } from 'react';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { ThemeProvider } from '@/modules/shared/providers/theme';
import { HealthPage } from '../HealthPage.js';

export const TEST_BASE_URL = 'http://api.test';

export function renderableHealthPage(): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => 'test-token',
  });
  return (
    <ThemeProvider>
      <ApiClientProvider client={client}>
        <HealthPage />
      </ApiClientProvider>
    </ThemeProvider>
  );
}
