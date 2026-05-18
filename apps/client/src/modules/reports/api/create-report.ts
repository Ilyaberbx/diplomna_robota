import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { CreateReportInput, ReportProjection } from '../reports.types.js';
import { reportProjectionSchema } from './report-schemas.js';

export function createReport(
  client: ApiClient,
  input: CreateReportInput,
): ResultAsync<ReportProjection, HttpError> {
  return client.post<unknown>('/reports', input).andThen((raw) => {
    const parsed = reportProjectionSchema.safeParse(raw);
    if (!parsed.success)
      return errAsync<ReportProjection, HttpError>({
        kind: 'parse',
        cause: parsed.error,
      });
    return okAsync<ReportProjection, HttpError>(parsed.data);
  });
}
