import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSession } from '../../providers/auth-session/index.js';
import type { PublicUser } from '../../auth.types.js';

export function useAccountPage(): {
  user: PublicUser | null;
  onLogout: () => void;
} {
  const { session, logout } = useAuthSession();
  const navigate = useNavigate();

  const onLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const user =
    session.phase === 'authenticated' ? session.user : null;
  return { user, onLogout };
}
