import { useLocation } from 'react-router-dom';
import { useAuthSession } from '../../providers/auth-session/index.js';
import type { AuthSession } from '../../auth.types.js';

export function useRouteGuard(): {
  session: AuthSession;
  loginRedirect: string;
} {
  const { session } = useAuthSession();
  const location = useLocation();
  const next = `${location.pathname}${location.search}`;
  const loginRedirect = `/login?next=${encodeURIComponent(next)}`;
  return { session, loginRedirect };
}
