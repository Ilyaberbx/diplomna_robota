import type { OwnerReport } from '../reports/index.js';

export type MatchStatus = 'proposed' | 'confirmed' | 'rejected';

export type MatchRecord = {
  id: string;
  lostReportId: string;
  foundReportId: string;
  proposedBy: string;
  status: MatchStatus;
  createdAt: Date;
  resolvedAt: Date | null;
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

// A confirmed Match additionally carries the revealed contact projection of
// both reports. The reveal is sourced through the `reports` ReportsReader
// port — this module never re-derives the projection.
export type RevealedMatchView = MatchView & {
  lostReport: OwnerReport;
  foundReport: OwnerReport;
};

export type CreateMatchData = {
  lostReportId: string;
  foundReportId: string;
  proposedBy: string;
};
