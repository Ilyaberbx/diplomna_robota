import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { MatchView, ProposeMatchInput } from '../matches.types.js';
import { matchViewSchema } from './match-schemas.js';

export function proposeMatch(
  client: ApiClient,
  input: ProposeMatchInput,
): ResultAsync<MatchView, HttpError> {
  return client.post<unknown>('/matches', input).andThen((raw) => {
    const parsed = matchViewSchema.safeParse(raw);
    if (!parsed.success)
      return errAsync<MatchView, HttpError>({
        kind: 'parse',
        cause: parsed.error,
      });
    return okAsync<MatchView, HttpError>(parsed.data);
  });
}
