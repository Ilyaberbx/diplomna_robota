import type { ReactElement } from 'react';
import {
  MemoryRouter,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { I18nProvider } from '@/modules/shared/providers/i18n';
import { AccountPage } from '../../../pages/account/AccountPage.js';
import { LoginPage } from '../../../pages/login/LoginPage.js';
import { RegisterPage } from '../../../pages/register/RegisterPage.js';
import { RouteGuard } from '../RouteGuard.js';
import { AuthSessionProvider } from '../../../providers/auth-session/index.js';
import { tokenStorage } from '../../../services/token-storage.js';

export const TEST_BASE_URL = 'http://api.test';

const shell = (
  <AuthSessionProvider>
    <Outlet />
  </AuthSessionProvider>
);

export function renderableAuthApp(initialPath: string): ReactElement {
  const client = createApiClient({
    baseUrl: TEST_BASE_URL,
    getAccessToken: async () => tokenStorage.get() ?? 'anonymous',
  });
  return (
    <I18nProvider>
      <ApiClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={shell}>
            <Route path="/" element={<p>Home</p>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/me"
              element={
                <RouteGuard>
                  <AccountPage />
                </RouteGuard>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </ApiClientProvider>
    </I18nProvider>
  );
}
