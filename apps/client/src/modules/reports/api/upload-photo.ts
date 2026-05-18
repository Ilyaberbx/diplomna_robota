import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { ReportProjection } from '../reports.types.js';
import { reportProjectionSchema } from './report-schemas.js';

export function uploadPhoto(
  client: ApiClient,
  reportId: string,
  file: File,
): ResultAsync<ReportProjection, HttpError> {
  return client
    .upload<unknown>(`/reports/${reportId}/photo`, file, file.name)
    .andThen((raw) => {
      const parsed = reportProjectionSchema.safeParse(raw);
      if (!parsed.success)
        return errAsync<ReportProjection, HttpError>({
          kind: 'parse',
          cause: parsed.error,
        });
      return okAsync<ReportProjection, HttpError>(parsed.data);
    });
}
