import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { BrowseQuery, ReportPage } from '../reports.types.js';
import { reportPageSchema } from './report-schemas.js';

export function browseQueryToSearch(query: BrowseQuery): string {
  const params = new URLSearchParams();
  if (query.kind) params.set('kind', query.kind);
  if (query.species) params.set('species', query.species);
  if (query.status) params.set('status', query.status);
  if (query.lat !== undefined) params.set('lat', String(query.lat));
  if (query.lng !== undefined) params.set('lng', String(query.lng));
  if (query.radiusKm !== undefined)
    params.set('radiusKm', String(query.radiusKm));
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  params.set('page', String(query.page));
  if (query.pageSize !== undefined)
    params.set('pageSize', String(query.pageSize));
  return params.toString();
}

export function browseReports(
  client: ApiClient,
  query: BrowseQuery,
): ResultAsync<ReportPage, HttpError> {
  return client
    .get<unknown>(`/reports?${browseQueryToSearch(query)}`)
    .andThen((raw) => {
      const parsed = reportPageSchema.safeParse(raw);
      if (!parsed.success)
        return errAsync<ReportPage, HttpError>({
          kind: 'parse',
          cause: parsed.error,
        });
      return okAsync<ReportPage, HttpError>(parsed.data);
    });
}
