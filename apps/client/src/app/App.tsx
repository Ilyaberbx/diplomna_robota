import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HealthPage, NotFoundPage } from '@/modules/connectivity';
import {
  AccountPage,
  LoginPage,
  RegisterPage,
  RouteGuard,
} from '@/modules/auth';
import {
  BrowsePage,
  CandidatesPage,
  CreateReportPage,
  LandingPage,
  MyReportsPage,
  ReportDetailPage,
} from '@/modules/reports';
import { MatchDetailPage, MyMatchesPage } from '@/modules/matches';
import { ApiClientProvider } from '@/modules/shared/providers/api-client';
import { ThemeProvider } from '@/modules/shared/providers/theme';
import { apiClient } from './api-client.js';
import { AppShell } from './AppShell.js';

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/health', element: <HealthPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/browse', element: <BrowsePage /> },
      { path: '/reports/:id', element: <ReportDetailPage /> },
      {
        path: '/reports/:id/candidates',
        element: (
          <RouteGuard>
            <CandidatesPage />
          </RouteGuard>
        ),
      },
      {
        path: '/report/new',
        element: (
          <RouteGuard>
            <CreateReportPage />
          </RouteGuard>
        ),
      },
      {
        path: '/me',
        element: (
          <RouteGuard>
            <AccountPage />
          </RouteGuard>
        ),
      },
      {
        path: '/me/reports',
        element: (
          <RouteGuard>
            <MyReportsPage />
          </RouteGuard>
        ),
      },
      {
        path: '/me/matches',
        element: (
          <RouteGuard>
            <MyMatchesPage />
          </RouteGuard>
        ),
      },
      {
        path: '/matches/:id',
        element: (
          <RouteGuard>
            <MatchDetailPage />
          </RouteGuard>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
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
