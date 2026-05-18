import type { ResultAsync } from 'neverthrow';
import type { DbError, NotFound } from '../shared/errors.js';
import type {
  PublicReport,
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
}

export interface ReportsWriter {
  markStatus(
    id: string,
    status: ReportRecord['status'],
  ): ResultAsync<ReportRecord, NotFound | DbError>;
}
