import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { MatchView } from '../matches.types.js';
import { matchListSchema } from './match-schemas.js';

export function listMatches(
  client: ApiClient,
  reportId: string,
): ResultAsync<MatchView[], HttpError> {
  return client
    .get<unknown>(`/matches?reportId=${reportId}`)
    .andThen((raw) => {
      const parsed = matchListSchema.safeParse(raw);
      if (!parsed.success)
        return errAsync<MatchView[], HttpError>({
          kind: 'parse',
          cause: parsed.error,
        });
      return okAsync<MatchView[], HttpError>(parsed.data);
    });
}
