import type { ReactElement } from 'react';
import { createApiClient } from '@/modules/shared/http/api-client';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { I18nProvider } from '@/modules/shared/providers/i18n';
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
      <I18nProvider>
      <ApiClientProvider client={client}>
        <HealthPage />
      </ApiClientProvider>
    </I18nProvider>
    </ThemeProvider>
  );
}
