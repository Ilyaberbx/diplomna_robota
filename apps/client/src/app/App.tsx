import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HealthPage } from '@/modules/connectivity';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { ThemeProvider } from '@/modules/shared/providers/theme';
import { apiClient } from './api-client.js';

const router = createBrowserRouter([{ path: '/', element: <HealthPage /> }]);

export function App() {
  return (
    <ThemeProvider>
      <ApiClientProvider client={apiClient}>
        <RouterProvider router={router} />
      </ApiClientProvider>
    </ThemeProvider>
  );
}
