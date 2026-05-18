import { Injectable } from '@nestjs/common';
import type { ResultAsync } from 'neverthrow';
import type { DbError } from '../shared/errors.js';
import { MatchesRepository } from './matches.repository.js';

export const MATCHES_READER = Symbol('MATCHES_READER');

export interface MatchesReader {
  // Whether the given Lost Report has at least one `confirmed` Match. The
  // `matches` module owns this fact; `reports` delegates the
  // reunited-requires-confirmed-Match lifecycle rule to it through this port
  // and never reads the `matches` table itself.
  hasConfirmedMatchForLost(
    lostReportId: string,
  ): ResultAsync<boolean, DbError>;
}

@Injectable()
export class MatchConfirmationReader implements MatchesReader {
  constructor(private readonly repo: MatchesRepository) {}

  hasConfirmedMatchForLost(
    lostReportId: string,
  ): ResultAsync<boolean, DbError> {
    return this.repo
      .countConfirmedForLost(lostReportId)
      .map((count) => count > 0);
  }
}
