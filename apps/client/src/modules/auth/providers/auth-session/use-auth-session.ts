import { useContext } from 'react';
import { AuthSessionContext } from './auth-session.context.js';
import type { AuthSessionValue } from '../../auth.types.js';

export function useAuthSession(): AuthSessionValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx)
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  return ctx;
}
