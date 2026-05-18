import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { I18nProvider } from '@/modules/shared/providers/i18n';
import { CandidatesPage } from '../CandidatesPage.js';

export const TEST_BASE_URL = 'http://api.test';

export function renderableCandidatesPage(id = 'r1'): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => 'test-token',
  });
  return (
    <I18nProvider>
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
    </I18nProvider>
  );
}
