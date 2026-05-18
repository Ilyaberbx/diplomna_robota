import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { AuthResult, Credentials } from '../auth.types.js';
import { authResultSchema } from './auth-schemas.js';

export function register(
  client: ApiClient,
  input: Credentials,
): ResultAsync<AuthResult, HttpError> {
  return client.post<unknown>('/auth/register', input).andThen((raw) => {
    const parsed = authResultSchema.safeParse(raw);
    if (!parsed.success)
      return errAsync<AuthResult, HttpError>({
        kind: 'parse',
        cause: parsed.error,
      });
    return okAsync<AuthResult, HttpError>(parsed.data);
  });
}
