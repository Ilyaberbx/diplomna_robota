import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { ReportProjection, StatusTarget } from '../reports.types.js';
import { reportProjectionSchema } from './report-schemas.js';

export function changeReportStatus(
  client: ApiClient,
  reportId: string,
  target: StatusTarget,
): ResultAsync<ReportProjection, HttpError> {
  return client
    .post<unknown>(`/reports/${reportId}/status`, { status: target })
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
