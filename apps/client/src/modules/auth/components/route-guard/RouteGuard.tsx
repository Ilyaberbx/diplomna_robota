import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRouteGuard } from './use-route-guard.js';

export function RouteGuard({ children }: { children: ReactNode }) {
  const { session, loginRedirect } = useRouteGuard();
  if (session.phase === 'loading') return <p>Loading…</p>;
  if (session.phase === 'anonymous')
    return <Navigate to={loginRedirect} replace />;
  return <>{children}</>;
}
