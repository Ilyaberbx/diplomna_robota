import { Inject, Injectable } from '@nestjs/common';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import {
  REPORTS_READER,
  type ReportsReader,
  type OwnerReport,
} from '../reports/index.js';
import type { DbError } from '../shared/errors.js';
import {
  conflict,
  forbidden,
  notFound,
  type Conflict,
  type Forbidden,
  type NotFound,
} from './matches.errors.js';
import { MatchesRepository } from './matches.repository.js';
import type {
  MatchRecord,
  MatchView,
  RevealedMatchView,
} from './matches.types.js';

function toView(record: MatchRecord): MatchView {
  return {
    id: record.id,
    lostReportId: record.lostReportId,
    foundReportId: record.foundReportId,
    proposedBy: record.proposedBy,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    resolvedAt: record.resolvedAt ? record.resolvedAt.toISOString() : null,
  };
}

@Injectable()
export class MatchesService {
  constructor(
    private readonly repo: MatchesRepository,
    @Inject(REPORTS_READER) private readonly reports: ReportsReader,
  ) {}

  propose(
    actorId: string,
    lostReportId: string,
    foundReportId: string,
  ): ResultAsync<MatchView, Forbidden | NotFound | Conflict | DbError> {
    return ResultAsync.combine([
      this.reports.getRecord(lostReportId),
      this.reports.getRecord(foundReportId),
    ]).andThen(([lost, found]) => {
      const isLostSideLost = lost.kind === 'lost';
      const isFoundSideFound = found.kind === 'found';
      const isWellFormedPair = isLostSideLost && isFoundSideFound;
      if (!isWellFormedPair)
        return errAsync(
          forbidden('a match links one lost report to one found report'),
        );

      const ownsLostSide = lost.reporterId === actorId;
      const ownsFoundSide = found.reporterId === actorId;
      const ownsOneSide = ownsLostSide || ownsFoundSide;
      if (!ownsOneSide)
        return errAsync(
          forbidden('proposer must own one side of the match'),
        );

      return this.repo
        .findPair(lostReportId, foundReportId)
        .andThen((existing) => {
          const isDuplicate = existing !== null;
          if (isDuplicate)
            return errAsync(
              conflict('a match for this lost/found pair already exists'),
            );
          return this.repo
            .insert({ lostReportId, foundReportId, proposedBy: actorId })
            .map(toView);
        });
    });
  }

  listForReport(
    reportId: string,
  ): ResultAsync<MatchView[], DbError> {
    return this.repo
      .findForReport(reportId)
      .map((records) => records.map(toView));
  }

  confirm(
    actorId: string,
    matchId: string,
  ): ResultAsync<
    RevealedMatchView,
    Forbidden | NotFound | Conflict | DbError
  > {
    return this.decide(actorId, matchId, 'confirmed').andThen((record) =>
      this.reveal(record),
    );
  }

  reject(
    actorId: string,
    matchId: string,
  ): ResultAsync<MatchView, Forbidden | NotFound | Conflict | DbError> {
    return this.decide(actorId, matchId, 'rejected').map(toView);
  }

  private decide(
    actorId: string,
    matchId: string,
    status: 'confirmed' | 'rejected',
  ): ResultAsync<
    MatchRecord,
    Forbidden | NotFound | Conflict | DbError
  > {
    return this.repo.findById(matchId).andThen((match) => {
      const isMissing = match === null;
      if (isMissing) return errAsync(notFound('match', matchId));
      const isStillPending = match.status === 'proposed';
      if (!isStillPending)
        return errAsync(
          conflict('only a proposed match can be confirmed or rejected'),
        );
      return this.authorizeDecider(actorId, match).andThen(() =>
        this.repo.resolve(match.id, status),
      );
    });
  }

  private authorizeDecider(
    actorId: string,
    match: MatchRecord,
  ): ResultAsync<true, Forbidden | NotFound | DbError> {
    return ResultAsync.combine([
      this.reports.getRecord(match.lostReportId),
      this.reports.getRecord(match.foundReportId),
    ]).andThen(([lost, found]) => {
      const proposerOwnsLostSide = lost.reporterId === match.proposedBy;
      const decidingReporterId = proposerOwnsLostSide
        ? found.reporterId
        : lost.reporterId;
      const isNonProposingReporter = actorId === decidingReporterId;
      if (!isNonProposingReporter)
        return errAsync(
          forbidden('only the non-proposing reporter may decide this match'),
        );
      return okAsync<true>(true);
    });
  }

  private reveal(
    record: MatchRecord,
  ): ResultAsync<RevealedMatchView, NotFound | DbError> {
    return ResultAsync.combine([
      this.reports.revealContact(record.lostReportId),
      this.reports.revealContact(record.foundReportId),
    ]).map(([lostReport, foundReport]: [OwnerReport, OwnerReport]) => ({
      ...toView(record),
      lostReport,
      foundReport,
    }));
  }
}
