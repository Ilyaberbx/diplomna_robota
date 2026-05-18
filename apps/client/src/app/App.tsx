import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HealthPage } from '@/modules/connectivity';
import {
  AccountPage,
  LoginPage,
  RegisterPage,
  RouteGuard,
} from '@/modules/auth';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { ThemeProvider } from '@/modules/shared/providers/theme';
import { apiClient } from './api-client.js';
import { AppShell } from './AppShell.js';

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HealthPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        path: '/me',
        element: (
          <RouteGuard>
            <AccountPage />
          </RouteGuard>
        ),
      },
    ],
  },
]);

export function App() {
  return (
    <ThemeProvider>
      <ApiClientProvider client={apiClient}>
        <RouterProvider router={router} />
      </ApiClientProvider>
    </ThemeProvider>
  );
}
