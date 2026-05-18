export type ReportKind = 'lost' | 'found';

export type ReportSpecies = 'dog' | 'cat' | 'bird' | 'other';

export type ReportStatus = 'active' | 'reunited' | 'resolved' | 'closed';

export type ReportRecord = {
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
  contactPhone: string | null;
  contactEmail: string | null;
  lat: number;
  lng: number;
  eventDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

// The public projection never carries contact fields (privacy is a
// service-layer rule, not a UI concern).
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

// The owner / confirmed-counterpart projection adds the contact panel.
export type OwnerReport = PublicReport & {
  viewer: 'owner';
  contactPhone: string | null;
  contactEmail: string | null;
};

export type ReportProjection = (PublicReport & { viewer: 'public' }) | OwnerReport;

export type ReportPage = {
  items: PublicReport[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateReportData = {
  reporterId: string;
  kind: ReportKind;
  species: ReportSpecies;
  status: ReportStatus;
  breed: string | null;
  name: string | null;
  color: string | null;
  description: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  lat: number;
  lng: number;
  eventDate: Date;
};

export type UpdateReportData = {
  species?: ReportSpecies;
  breed?: string | null;
  name?: string | null;
  color?: string | null;
  description?: string | null;
  photoKey?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  lat?: number;
  lng?: number;
  eventDate?: Date;
};

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type UploadedPhoto = {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
};

// The subset of multer's file object the controller reads. Typed locally so
// the build does not depend on the ambient `Express.Multer` namespace
// (tsconfig `types` is pinned to `node`).
export type MultipartFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

// A Candidate is a computed same-animal suggestion for a given report: the
// opposite-kind public report plus the legible match signal that ranked it
// (species equality, Haversine distance, date-window proximity). Never
// stored (CONTEXT.md "Candidate").
export type Candidate = {
  report: PublicReport;
  distanceKm: number;
  speciesMatch: boolean;
  daysApart: number;
};

export type CandidateRecord = {
  report: ReportRecord;
  distanceKm: number;
  speciesMatch: boolean;
  daysApart: number;
};

export type BrowseFilters = {
  kind?: ReportKind;
  species?: ReportSpecies;
  status?: ReportStatus;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};
