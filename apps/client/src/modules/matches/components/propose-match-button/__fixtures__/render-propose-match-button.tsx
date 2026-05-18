import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { ProposeMatchButton } from '../ProposeMatchButton.js';

export const TEST_BASE_URL = 'http://api.test';

export function renderableProposeMatchButton(): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => 'test-token',
  });
  return (
    <ApiClientProvider client={client}>
      <MemoryRouter>
        <ProposeMatchButton
          lostReportId="lost-1"
          foundReportId="found-1"
        />
      </MemoryRouter>
    </ApiClientProvider>
  );
}
