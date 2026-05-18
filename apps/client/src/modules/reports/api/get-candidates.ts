import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { Candidate } from '../reports.types.js';
import { candidatesSchema } from './report-schemas.js';

export function getCandidates(
  client: ApiClient,
  reportId: string,
): ResultAsync<Candidate[], HttpError> {
  return client
    .get<unknown>(`/reports/${reportId}/candidates`)
    .andThen((raw) => {
      const parsed = candidatesSchema.safeParse(raw);
      if (!parsed.success)
        return errAsync<Candidate[], HttpError>({
          kind: 'parse',
          cause: parsed.error,
        });
      return okAsync<Candidate[], HttpError>(parsed.data);
    });
}
