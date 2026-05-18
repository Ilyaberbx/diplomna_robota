import type { ResultAsync } from 'neverthrow';
import type { HttpError } from '@/modules/shared/http/http.types';

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

export type CreateReportFn = (
  input: CreateReportInput,
) => ResultAsync<ReportProjection, HttpError>;
