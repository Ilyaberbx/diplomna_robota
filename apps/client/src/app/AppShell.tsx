import { Outlet } from 'react-router-dom';
import { AuthSessionProvider } from '@/modules/auth';

export function AppShell() {
  return (
    <AuthSessionProvider>
      <Outlet />
    </AuthSessionProvider>
  );
}
