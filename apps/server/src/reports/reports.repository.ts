import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import { ResultAsync } from 'neverthrow';
import { DRIZZLE, type Database } from '../db/db.module.js';
import { reports } from '../db/schema.js';
import { dbError, type DbError } from '../shared/errors.js';
import type {
  BrowseFilters,
  CreateReportData,
  ReportRecord,
  UpdateReportData,
} from './reports.types.js';

const EARTH_RADIUS_KM = 6371;

type ReportRow = typeof reports.$inferSelect;

function toRecord(row: ReportRow): ReportRecord {
  return {
    id: row.id,
    kind: row.kind as ReportRecord['kind'],
    reporterId: row.reporterId,
    status: row.status as ReportRecord['status'],
    species: row.species as ReportRecord['species'],
    breed: row.breed,
    name: row.name,
    color: row.color,
    description: row.description,
    photoKey: row.photoKey,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    lat: row.lat,
    lng: row.lng,
    eventDate: row.eventDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class ReportsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  insert(data: CreateReportData): ResultAsync<ReportRecord, DbError> {
    return ResultAsync.fromPromise(
      this.db
        .insert(reports)
        .values({
          reporterId: data.reporterId,
          kind: data.kind,
          species: data.species,
          status: data.status,
          breed: data.breed,
          name: data.name,
          color: data.color,
          description: data.description,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          lat: data.lat,
          lng: data.lng,
          eventDate: data.eventDate,
        })
        .returning(),
      (cause) => dbError(cause),
    ).map((rows) => toRecord(rows[0]));
  }

  findById(id: string): ResultAsync<ReportRecord | null, DbError> {
    return ResultAsync.fromPromise(
      this.db.select().from(reports).where(eq(reports.id, id)).limit(1),
      (cause) => dbError(cause),
    ).map((rows) => (rows[0] ? toRecord(rows[0]) : null));
  }

  update(
    id: string,
    data: UpdateReportData,
  ): ResultAsync<ReportRecord, DbError> {
    return ResultAsync.fromPromise(
      this.db
        .update(reports)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(reports.id, id))
        .returning(),
      (cause) => dbError(cause),
    ).map((rows) => toRecord(rows[0]));
  }

  updateStatus(
    id: string,
    status: ReportRecord['status'],
  ): ResultAsync<ReportRecord, DbError> {
    return ResultAsync.fromPromise(
      this.db
        .update(reports)
        .set({ status, updatedAt: new Date() })
        .where(eq(reports.id, id))
        .returning(),
      (cause) => dbError(cause),
    ).map((rows) => toRecord(rows[0]));
  }

  browse(
    filters: BrowseFilters,
  ): ResultAsync<{ items: ReportRecord[]; total: number }, DbError> {
    const where = this.buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;

    const itemsQuery = this.db
      .select()
      .from(reports)
      .where(where)
      .orderBy(desc(reports.createdAt))
      .limit(filters.pageSize)
      .offset(offset);

    const countQuery = this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(reports)
      .where(where);

    return ResultAsync.fromPromise(
      Promise.all([itemsQuery, countQuery]),
      (cause) => dbError(cause),
    ).map(([rows, countRows]) => ({
      items: rows.map(toRecord),
      total: countRows[0]?.total ?? 0,
    }));
  }

  private buildWhere(filters: BrowseFilters): SQL | undefined {
    const clauses: SQL[] = [];

    const hasKind = filters.kind !== undefined;
    if (hasKind) clauses.push(eq(reports.kind, filters.kind as string));

    const hasSpecies = filters.species !== undefined;
    if (hasSpecies)
      clauses.push(eq(reports.species, filters.species as string));

    const hasStatus = filters.status !== undefined;
    if (hasStatus) clauses.push(eq(reports.status, filters.status as string));

    const hasFrom = filters.from !== undefined;
    if (hasFrom) clauses.push(gte(reports.eventDate, filters.from as Date));

    const hasTo = filters.to !== undefined;
    if (hasTo) clauses.push(lte(reports.eventDate, filters.to as Date));

    const hasArea =
      filters.lat !== undefined &&
      filters.lng !== undefined &&
      filters.radiusKm !== undefined;
    if (hasArea) clauses.push(this.withinRadius(filters));

    return clauses.length > 0 ? and(...clauses) : undefined;
  }

  private withinRadius(filters: BrowseFilters): SQL {
    const lat = filters.lat as number;
    const lng = filters.lng as number;
    const radiusKm = filters.radiusKm as number;
    return sql`${EARTH_RADIUS_KM} * acos(
      least(1, greatest(-1,
        cos(radians(${lat})) * cos(radians(${reports.lat}))
          * cos(radians(${reports.lng}) - radians(${lng}))
        + sin(radians(${lat})) * sin(radians(${reports.lat}))
      ))
    ) <= ${radiusKm}`;
  }
}
