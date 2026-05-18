import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { PublicUser } from '../auth.types.js';
import { publicUserSchema } from './auth-schemas.js';

export function getMe(
  client: ApiClient,
): ResultAsync<PublicUser, HttpError> {
  return client.get<unknown>('/auth/me').andThen((raw) => {
    const parsed = publicUserSchema.safeParse(raw);
    if (!parsed.success)
      return errAsync<PublicUser, HttpError>({
        kind: 'parse',
        cause: parsed.error,
      });
    return okAsync<PublicUser, HttpError>(parsed.data);
  });
}
