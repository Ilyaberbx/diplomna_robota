import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { AuthSessionProvider } from '@/modules/auth';
import { MyReportsPage } from '../MyReportsPage.js';

export const TEST_BASE_URL = 'http://api.test';
export const TEST_USER_ID = 'me-1';

export function renderableMyReportsPage(): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => 'test-token',
  });
  return (
    <ApiClientProvider client={client}>
      <AuthSessionProvider>
        <MemoryRouter initialEntries={['/me/reports']}>
          <Routes>
            <Route path="/me/reports" element={<MyReportsPage />} />
          </Routes>
        </MemoryRouter>
      </AuthSessionProvider>
    </ApiClientProvider>
  );
}

export function reportFixture(
  id: string,
  over: Record<string, unknown> = {},
) {
  return {
    id,
    kind: 'lost',
    reporterId: TEST_USER_ID,
    status: 'active',
    species: 'dog',
    breed: null,
    name: id,
    color: null,
    description: null,
    photoKey: null,
    lat: 1,
    lng: 2,
    eventDate: '2026-05-01T00:00:00.000Z',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...over,
  };
}
