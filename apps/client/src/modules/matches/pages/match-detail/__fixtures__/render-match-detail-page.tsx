import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { MatchDetailPage } from '../MatchDetailPage.js';

export const TEST_BASE_URL = 'http://api.test';

export function renderableMatchDetailPage(
  matchId = 'm1',
  reportId = 'lost-1',
): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => 'test-token',
  });
  return (
    <ApiClientProvider client={client}>
      <MemoryRouter
        initialEntries={[`/matches/${matchId}?reportId=${reportId}`]}
      >
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ApiClientProvider>
  );
}
