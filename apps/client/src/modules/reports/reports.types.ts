import type { ResultAsync } from 'neverthrow';
import type { HttpError } from '@/modules/shared/http/http.types';
import type { TKey } from '@/modules/shared/providers/i18n';

export type ReportKind = 'lost' | 'found';
export type ReportSpecies = 'dog' | 'cat' | 'bird' | 'other';
export type ReportStatus = 'active' | 'reunited' | 'resolved' | 'closed';

export type PublicReport = {
  id: string;
  kind: ReportKind;
  reporterId: string;
  status: ReportStatus;
  species: ReportSpecies;
  breed: string | null;
  name: string | null;
  color: string | null;
  description: string | null;
  photoKey: string | null;
  lat: number;
  lng: number;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportProjection =
  | (PublicReport & { viewer: 'public' })
  | (PublicReport & {
      viewer: 'owner';
      contactPhone: string | null;
      contactEmail: string | null;
    });

export type ReportPage = {
  items: PublicReport[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateReportInput = {
  kind: ReportKind;
  species: ReportSpecies;
  name?: string;
  breed?: string;
  color?: string;
  description?: string;
  contactPhone?: string;
  contactEmail?: string;
  lat: number;
  lng: number;
  eventDate: string;
};

export type BrowseQuery = {
  kind?: ReportKind;
  species?: ReportSpecies;
  status?: ReportStatus;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  from?: string;
  to?: string;
  page: number;
  pageSize?: number;
};

export type FeedState =
  | { phase: 'loading' }
  | { phase: 'empty'; page: number }
  | { phase: 'ready'; data: ReportPage }
  | { phase: 'error'; error: HttpError };

export type DetailState =
  | { phase: 'loading' }
  | { phase: 'ready'; report: ReportProjection }
  | { phase: 'error'; error: HttpError };

export type Candidate = {
  report: PublicReport;
  distanceKm: number;
  speciesMatch: boolean;
  daysApart: number;
};

export type CandidatesState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'ready'; candidates: Candidate[] }
  | { phase: 'error'; error: HttpError };

export type CreateReportFn = (
  input: CreateReportInput,
) => ResultAsync<ReportProjection, HttpError>;

export type StatusTarget = 'reunited' | 'resolved' | 'closed';

// A report the current user authored, plus its computed candidate count for
// the dashboard badge. `candidateCount` is null until the per-report
// candidates lookup resolves (or if it failed — the badge is then hidden).
export type MyReport = {
  report: PublicReport;
  candidateCount: number | null;
};

export type MyReportsGroupKey = 'active' | 'recovered' | 'closed';

export type MyReportsGroups = Record<MyReportsGroupKey, MyReport[]>;

export type MyReportsState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'ready'; groups: MyReportsGroups }
  | { phase: 'error'; error: HttpError };

export type ChangeStatusFn = (
  reportId: string,
  target: StatusTarget,
) => ResultAsync<ReportProjection, HttpError>;

export type MyReportsPageValue = {
  state: MyReportsState;
  onChangeStatus: ChangeStatusFn;
};

export type ReportRowProps = {
  entry: MyReport;
  onChangeStatus: ChangeStatusFn;
};

export type RowAction = { labelKey: TKey; target: StatusTarget };

export type ReportRowValue = {
  actions: RowAction[];
  pending: boolean;
  errorMessage: TKey | null;
  run: (target: StatusTarget) => void;
};
