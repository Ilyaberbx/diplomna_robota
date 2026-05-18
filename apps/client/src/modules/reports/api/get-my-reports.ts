import { type ResultAsync } from 'neverthrow';
import type { ApiClient, HttpError } from '@/modules/shared/http/http.types';
import type { PublicReport } from '../reports.types.js';
import { browseReports } from './browse-reports.js';

const MY_REPORTS_PAGE_SIZE = 100;

// No server-side "mine" filter exists yet (Slice 7 only adds the status
// route). The dashboard derives the user's reports from the public browse
// feed, filtered by reporter id client-side. One generous page is fetched;
// pagination of a single user's own reports is a later concern.
export function getMyReports(
  client: ApiClient,
  reporterId: string,
): ResultAsync<PublicReport[], HttpError> {
  return browseReports(client, {
    page: 1,
    pageSize: MY_REPORTS_PAGE_SIZE,
  }).map((reportPage) =>
    reportPage.items.filter((item) => item.reporterId === reporterId),
  );
}
