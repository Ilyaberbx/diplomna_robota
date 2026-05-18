import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { MatchView, RevealedMatchView } from '../matches.types.js';
import {
  matchViewSchema,
  revealedMatchViewSchema,
} from './match-schemas.js';

export function confirmMatch(
  client: ApiClient,
  matchId: string,
): ResultAsync<RevealedMatchView, HttpError> {
  return client
    .post<unknown>(`/matches/${matchId}/confirm`, {})
    .andThen((raw) => {
      const parsed = revealedMatchViewSchema.safeParse(raw);
      if (!parsed.success)
        return errAsync<RevealedMatchView, HttpError>({
          kind: 'parse',
          cause: parsed.error,
        });
      return okAsync<RevealedMatchView, HttpError>(parsed.data);
    });
}

export function rejectMatch(
  client: ApiClient,
  matchId: string,
): ResultAsync<MatchView, HttpError> {
  return client
    .post<unknown>(`/matches/${matchId}/reject`, {})
    .andThen((raw) => {
      const parsed = matchViewSchema.safeParse(raw);
      if (!parsed.success)
        return errAsync<MatchView, HttpError>({
          kind: 'parse',
          cause: parsed.error,
        });
      return okAsync<MatchView, HttpError>(parsed.data);
    });
}
