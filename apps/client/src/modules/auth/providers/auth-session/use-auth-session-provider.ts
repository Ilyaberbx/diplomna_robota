import { useCallback, useEffect, useMemo, useState } from 'react';
import { okAsync, type ResultAsync } from 'neverthrow';
import { useApiClient } from '@/modules/shared/providers/api-client';
import { subscribeToSessionExpired } from '@/modules/shared/http/session-expired';
import type { HttpError } from '@/modules/shared/http/http.types';
import { getMe } from '../../api/get-me.js';
import { login as loginRequest } from '../../api/login.js';
import { register as registerRequest } from '../../api/register.js';
import { tokenStorage } from '../../services/token-storage.js';
import type {
  AuthSession,
  AuthSessionValue,
  Credentials,
  PublicUser,
} from '../../auth.types.js';

export function useAuthSessionProvider(): AuthSessionValue {
  const client = useApiClient();
  const [session, setSession] = useState<AuthSession>(() => {
    const hasToken = tokenStorage.get() !== null;
    return hasToken ? { phase: 'loading' } : { phase: 'anonymous' };
  });

  useEffect(() => {
    const hasToken = tokenStorage.get() !== null;
    if (!hasToken) return;
    let active = true;
    void getMe(client).match(
      (user) => {
        if (active) setSession({ phase: 'authenticated', user });
      },
      () => {
        tokenStorage.clear();
        if (active) setSession({ phase: 'anonymous' });
      },
    );
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    return subscribeToSessionExpired(() => {
      tokenStorage.clear();
      setSession({ phase: 'anonymous' });
    });
  }, []);

  const login = useCallback(
    (input: Credentials): ResultAsync<PublicUser, HttpError> =>
      loginRequest(client, input).andThen((result) => {
        tokenStorage.set(result.token);
        setSession({ phase: 'authenticated', user: result.user });
        return okAsync<PublicUser, HttpError>(result.user);
      }),
    [client],
  );

  const register = useCallback(
    (input: Credentials): ResultAsync<PublicUser, HttpError> =>
      registerRequest(client, input).andThen((result) => {
        tokenStorage.set(result.token);
        setSession({ phase: 'authenticated', user: result.user });
        return okAsync<PublicUser, HttpError>(result.user);
      }),
    [client],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setSession({ phase: 'anonymous' });
  }, []);

  return useMemo(
    () => ({ session, login, register, logout }),
    [session, login, register, logout],
  );
}
