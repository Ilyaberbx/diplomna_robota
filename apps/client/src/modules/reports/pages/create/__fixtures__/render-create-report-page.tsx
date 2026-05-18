import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { I18nProvider } from '@/modules/shared/providers/i18n';
import { CreateReportPage } from '../CreateReportPage.js';

export const TEST_BASE_URL = 'http://api.test';

export function renderableCreateReportPage(
  initialPath = '/report/new',
): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => 'test-token',
  });
  return (
    <I18nProvider>
      <ApiClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/report/new" element={<CreateReportPage />} />
          <Route path="/reports/:id" element={<p>Published</p>} />
        </Routes>
      </MemoryRouter>
    </ApiClientProvider>
    </I18nProvider>
  );
}
