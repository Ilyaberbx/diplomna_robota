import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { CandidatesPage } from '../CandidatesPage.js';

export const TEST_BASE_URL = 'http://api.test';

export function renderableCandidatesPage(id = 'r1'): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => 'test-token',
  });
  return (
    <ApiClientProvider client={client}>
      <MemoryRouter initialEntries={[`/reports/${id}/candidates`]}>
        <Routes>
          <Route
            path="/reports/:id/candidates"
            element={<CandidatesPage />}
          />
        </Routes>
      </MemoryRouter>
    </ApiClientProvider>
  );
}
