import type { ReactNode } from 'react';
import { AuthSessionContext } from './auth-session.context.js';
import { useAuthSessionProvider } from './use-auth-session-provider.js';

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const value = useAuthSessionProvider();
  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
