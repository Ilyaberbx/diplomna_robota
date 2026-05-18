import type { HttpError } from '@/modules/shared/http/http.types';

export type MatchStatus = 'proposed' | 'confirmed' | 'rejected';

export type OwnerReport = {
  id: string;
  kind: 'lost' | 'found';
  reporterId: string;
  status: string;
  species: string;
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
  viewer: 'owner';
  contactPhone: string | null;
  contactEmail: string | null;
};

export type MatchView = {
  id: string;
  lostReportId: string;
  foundReportId: string;
  proposedBy: string;
  status: MatchStatus;
  createdAt: string;
  resolvedAt: string | null;
};

export type RevealedMatchView = MatchView & {
  lostReport: OwnerReport;
  foundReport: OwnerReport;
};

export type ProposeMatchInput = {
  lostReportId: string;
  foundReportId: string;
};

export type ProposeState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'proposed'; match: MatchView }
  | { phase: 'error'; error: HttpError };

export type MyMatchesState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | {
      phase: 'ready';
      awaitingYourDecision: MatchView[];
      awaitingOtherParty: MatchView[];
    }
  | { phase: 'error'; error: HttpError };

export type MatchDetailState =
  | { phase: 'loading' }
  | { phase: 'ready'; match: MatchView }
  | { phase: 'confirmed'; match: RevealedMatchView }
  | { phase: 'error'; error: HttpError };
