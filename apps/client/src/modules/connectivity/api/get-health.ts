import { errAsync, okAsync } from 'neverthrow';
import type { ResultAsync } from 'neverthrow';
import { z } from 'zod';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { HealthStatus } from '../connectivity.types.js';

const healthSchema = z.object({ status: z.literal('ok') });

export function getHealth(
  client: ApiClient,
): ResultAsync<HealthStatus, HttpError> {
  return client.get<unknown>('/health').andThen((raw) => {
    const parsed = healthSchema.safeParse(raw);
    if (!parsed.success) {
      return errAsync<HealthStatus, HttpError>({
        kind: 'parse',
        cause: parsed.error,
      });
    }
    return okAsync<HealthStatus, HttpError>(parsed.data);
  });
}
