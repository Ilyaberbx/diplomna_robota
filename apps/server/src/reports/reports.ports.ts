import type { ResultAsync } from 'neverthrow';
import type { DbError, NotFound } from '../shared/errors.js';
import type {
  PublicReport,
  OwnerReport,
  ReportRecord,
  ReportPage,
  BrowseFilters,
} from './reports.types.js';

export const REPORTS_READER = Symbol('REPORTS_READER');
export const REPORTS_WRITER = Symbol('REPORTS_WRITER');

export interface ReportsReader {
  getRecord(id: string): ResultAsync<ReportRecord, NotFound | DbError>;
  browsePublic(
    filters: BrowseFilters,
  ): ResultAsync<ReportPage, DbError>;
  publicById(id: string): ResultAsync<PublicReport, NotFound | DbError>;
  // The contact-included projection of a report. Cross-module callers use
  // this to surface contact only when the domain rule permits (e.g. a
  // confirmed Match). The projection (which fields are revealed) is owned
  // here; callers never re-derive it from the raw record.
  revealContact(
    id: string,
  ): ResultAsync<OwnerReport, NotFound | DbError>;
}

export interface ReportsWriter {
  markStatus(
    id: string,
    status: ReportRecord['status'],
  ): ResultAsync<ReportRecord, NotFound | DbError>;
}
