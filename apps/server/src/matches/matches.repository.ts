import { Inject, Injectable } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { ResultAsync } from 'neverthrow';
import { DRIZZLE, type Database } from '../db/db.module.js';
import { matches } from '../db/schema.js';
import { dbError, type DbError } from '../shared/errors.js';
import type {
  CreateMatchData,
  MatchRecord,
  MatchStatus,
} from './matches.types.js';

type MatchRow = typeof matches.$inferSelect;

function toRecord(row: MatchRow): MatchRecord {
  return {
    id: row.id,
    lostReportId: row.lostReportId,
    foundReportId: row.foundReportId,
    proposedBy: row.proposedBy,
    status: row.status as MatchStatus,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
  };
}

@Injectable()
export class MatchesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  insert(data: CreateMatchData): ResultAsync<MatchRecord, DbError> {
    return ResultAsync.fromPromise(
      this.db
        .insert(matches)
        .values({
          lostReportId: data.lostReportId,
          foundReportId: data.foundReportId,
          proposedBy: data.proposedBy,
          status: 'proposed',
        })
        .returning(),
      (cause) => dbError(cause),
    ).map((rows) => toRecord(rows[0]));
  }

  findById(id: string): ResultAsync<MatchRecord | null, DbError> {
    return ResultAsync.fromPromise(
      this.db.select().from(matches).where(eq(matches.id, id)).limit(1),
      (cause) => dbError(cause),
    ).map((rows) => (rows[0] ? toRecord(rows[0]) : null));
  }

  findPair(
    lostReportId: string,
    foundReportId: string,
  ): ResultAsync<MatchRecord | null, DbError> {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.lostReportId, lostReportId),
            eq(matches.foundReportId, foundReportId),
          ),
        )
        .limit(1),
      (cause) => dbError(cause),
    ).map((rows) => (rows[0] ? toRecord(rows[0]) : null));
  }

  findForReport(reportId: string): ResultAsync<MatchRecord[], DbError> {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(matches)
        .where(
          or(
            eq(matches.lostReportId, reportId),
            eq(matches.foundReportId, reportId),
          ),
        ),
      (cause) => dbError(cause),
    ).map((rows) => rows.map(toRecord));
  }

  countConfirmedForLost(
    lostReportId: string,
  ): ResultAsync<number, DbError> {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.lostReportId, lostReportId),
            eq(matches.status, 'confirmed'),
          ),
        )
        .limit(1),
      (cause) => dbError(cause),
    ).map((rows) => rows.length);
  }

  resolve(
    id: string,
    status: Extract<MatchStatus, 'confirmed' | 'rejected'>,
  ): ResultAsync<MatchRecord, DbError> {
    return ResultAsync.fromPromise(
      this.db
        .update(matches)
        .set({ status, resolvedAt: new Date() })
        .where(eq(matches.id, id))
        .returning(),
      (cause) => dbError(cause),
    ).map((rows) => toRecord(rows[0]));
  }
}
