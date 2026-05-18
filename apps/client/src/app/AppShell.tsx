import { AuthSessionProvider, useAuthSession } from '@/modules/auth';
import { AppShell as AppShellLayout } from '@/modules/shared/layout/app-shell';

function ShellChrome() {
  const { session, logout } = useAuthSession();
  const userEmail =
    session.phase === 'authenticated' ? session.user.email : null;
  const isLoading = session.phase === 'loading';

  return (
    <AppShellLayout
      userEmail={userEmail}
      isLoading={isLoading}
      onLogout={logout}
    />
  );
}

export function AppShell() {
  return (
    <AuthSessionProvider>
      <ShellChrome />
    </AuthSessionProvider>
  );
}
