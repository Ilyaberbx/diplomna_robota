import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { BrowsePage } from '../BrowsePage.js';

export const TEST_BASE_URL = 'http://api.test';

export function renderableBrowsePage(initialPath = '/browse'): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => 'test-token',
  });
  return (
    <ApiClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/reports/:id" element={<p>Detail</p>} />
        </Routes>
      </MemoryRouter>
    </ApiClientProvider>
  );
}
