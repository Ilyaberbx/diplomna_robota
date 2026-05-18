import { Inject, Injectable } from '@nestjs/common';
import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import type { DbError } from '../shared/errors.js';
import {
  STORAGE_CLIENT,
  type StoragePort,
  type StoredBlob,
} from '../storage/index.js';
import {
  forbidden,
  notFound,
  payloadTooLarge,
  unsupportedMediaType,
  type Forbidden,
  type NotFound,
  type PayloadTooLarge,
  type UnsupportedMediaType,
} from './reports.errors.js';
import { ReportsRepository } from './reports.repository.js';
import type {
  CreateReportInput,
  UpdateReportInput,
  BrowseQueryInput,
} from './reports.dto.js';
import { ALLOWED_PHOTO_MIME, PHOTO_MAX_BYTES } from './reports.types.js';
import type { ReportsReader, ReportsWriter } from './reports.ports.js';
import type {
  BrowseFilters,
  OwnerReport,
  PublicReport,
  ReportPage,
  ReportProjection,
  ReportRecord,
  UploadedPhoto,
} from './reports.types.js';

function toPublic(record: ReportRecord): PublicReport {
  return {
    id: record.id,
    kind: record.kind,
    reporterId: record.reporterId,
    status: record.status,
    species: record.species,
    breed: record.breed,
    name: record.name,
    color: record.color,
    description: record.description,
    photoKey: record.photoKey,
    lat: record.lat,
    lng: record.lng,
    eventDate: record.eventDate.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toOwner(record: ReportRecord): OwnerReport {
  return {
    ...toPublic(record),
    viewer: 'owner',
    contactPhone: record.contactPhone,
    contactEmail: record.contactEmail,
  };
}

@Injectable()
export class ReportsService implements ReportsReader, ReportsWriter {
  constructor(
    private readonly repo: ReportsRepository,
    @Inject(STORAGE_CLIENT) private readonly storage: StoragePort,
  ) {}

  attachPhoto(
    actorId: string,
    id: string,
    photo: UploadedPhoto,
  ): ResultAsync<
    OwnerReport,
    Forbidden | NotFound | UnsupportedMediaType | PayloadTooLarge | DbError
  > {
    const allowed: readonly string[] = ALLOWED_PHOTO_MIME;
    const isAllowedMime = allowed.includes(photo.mimeType);
    if (!isAllowedMime)
      return errAsync(unsupportedMediaType(photo.mimeType));
    const isTooLarge = photo.sizeBytes > PHOTO_MAX_BYTES;
    if (isTooLarge) return errAsync(payloadTooLarge(PHOTO_MAX_BYTES));

    return this.getRecord(id).andThen((record) => {
      const isReporter = record.reporterId === actorId;
      if (!isReporter)
        return errAsync(
          forbidden('only the reporter may add a photo to this report'),
        );
      return this.storage
        .put(photo.buffer, photo.mimeType)
        .andThen((key) => this.repo.update(id, { photoKey: key }))
        .map(toOwner);
    });
  }

  getPhoto(
    id: string,
  ): ResultAsync<StoredBlob, NotFound | DbError> {
    return this.getRecord(id).andThen((record) => {
      const hasPhoto = record.photoKey !== null;
      if (!hasPhoto) return errAsync(notFound('photo', id));
      return this.storage.get(record.photoKey as string);
    });
  }

  getRecord(id: string): ResultAsync<ReportRecord, NotFound | DbError> {
    return this.repo.findById(id).andThen((record) => {
      const isMissing = record === null;
      if (isMissing) return errAsync(notFound('report', id));
      return okAsync(record);
    });
  }

  publicById(id: string): ResultAsync<PublicReport, NotFound | DbError> {
    return this.getRecord(id).map(toPublic);
  }

  browsePublic(filters: BrowseFilters): ResultAsync<ReportPage, DbError> {
    return this.repo.browse(filters).map((result) => ({
      items: result.items.map(toPublic),
      page: filters.page,
      pageSize: filters.pageSize,
      total: result.total,
    }));
  }

  markStatus(
    id: string,
    status: ReportRecord['status'],
  ): ResultAsync<ReportRecord, NotFound | DbError> {
    return this.getRecord(id).andThen(() =>
      this.repo.updateStatus(id, status),
    );
  }

  create(
    actorId: string,
    input: CreateReportInput,
  ): ResultAsync<OwnerReport, DbError> {
    return this.repo
      .insert({
        reporterId: actorId,
        kind: input.kind,
        species: input.species,
        status: 'active',
        breed: input.breed ?? null,
        name: input.name ?? null,
        color: input.color ?? null,
        description: input.description ?? null,
        contactPhone: input.contactPhone ?? null,
        contactEmail: input.contactEmail ?? null,
        lat: input.lat,
        lng: input.lng,
        eventDate: input.eventDate,
      })
      .map(toOwner);
  }

  browse(query: BrowseQueryInput): ResultAsync<ReportPage, DbError> {
    return this.repo
      .browse({
        kind: query.kind,
        species: query.species,
        status: query.status,
        lat: query.lat,
        lng: query.lng,
        radiusKm: query.radiusKm,
        from: query.from,
        to: query.to,
        page: query.page,
        pageSize: query.pageSize,
      })
      .map((result) => ({
        items: result.items.map(toPublic),
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
      }));
  }

  getOne(
    actorId: string | null,
    id: string,
  ): ResultAsync<ReportProjection, NotFound | DbError> {
    return this.repo.findById(id).andThen((record) => {
      const isMissing = record === null;
      if (isMissing) return errAsync(notFound('report', id));
      const isReporter = actorId !== null && record.reporterId === actorId;
      if (isReporter) return okAsync<ReportProjection>(toOwner(record));
      return okAsync<ReportProjection>({ ...toPublic(record), viewer: 'public' });
    });
  }

  update(
    actorId: string,
    id: string,
    input: UpdateReportInput,
  ): ResultAsync<OwnerReport, Forbidden | NotFound | DbError> {
    return this.repo.findById(id).andThen((record) => {
      const isMissing = record === null;
      if (isMissing) return errAsync(notFound('report', id));
      const isReporter = record.reporterId === actorId;
      if (!isReporter)
        return errAsync(forbidden('only the reporter may edit this report'));
      return this.repo.update(id, input).map(toOwner);
    });
  }
}
