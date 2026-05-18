import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { dbError, type DbError } from '../../shared/errors.js';
import { ReportsService } from '../reports.service.js';
import type { CreateReportInput } from '../reports.dto.js';
import type {
  CreateReportData,
  ReportRecord,
  UpdateReportData,
} from '../reports.types.js';

const RECORD: ReportRecord = {
  id: 'rep-1',
  kind: 'lost',
  reporterId: 'user-1',
  status: 'active',
  species: 'dog',
  breed: null,
  name: 'Rex',
  color: 'brown',
  description: null,
  photoKey: null,
  contactPhone: '+100',
  contactEmail: 'a@b.com',
  lat: 1,
  lng: 2,
  eventDate: new Date('2026-05-01T00:00:00Z'),
  createdAt: new Date('2026-05-01T00:00:00Z'),
  updatedAt: new Date('2026-05-01T00:00:00Z'),
};

type RepoBehaviour = {
  insertFails?: boolean;
  browseFails?: boolean;
  updateFails?: boolean;
  found?: ReportRecord | null;
  findFails?: boolean;
};

class FakeRepo {
  constructor(private readonly b: RepoBehaviour = {}) {}

  insert(data: CreateReportData): ResultAsync<ReportRecord, DbError> {
    if (this.b.insertFails) return errAsync(dbError('insert'));
    return okAsync({ ...RECORD, ...data, id: 'rep-new' });
  }

  findById(_id: string): ResultAsync<ReportRecord | null, DbError> {
    if (this.b.findFails) return errAsync(dbError('find'));
    return okAsync(this.b.found ?? null);
  }

  update(
    _id: string,
    data: UpdateReportData,
  ): ResultAsync<ReportRecord, DbError> {
    if (this.b.updateFails) return errAsync(dbError('update'));
    return okAsync({ ...RECORD, ...data });
  }

  updateStatus(
    _id: string,
    status: ReportRecord['status'],
  ): ResultAsync<ReportRecord, DbError> {
    return okAsync({ ...RECORD, status });
  }

  browse(
    _f: unknown,
  ): ResultAsync<{ items: ReportRecord[]; total: number }, DbError> {
    if (this.b.browseFails) return errAsync(dbError('browse'));
    return okAsync({ items: [RECORD], total: 1 });
  }
}

function svc(b: RepoBehaviour = {}): ReportsService {
  return new ReportsService(new FakeRepo(b) as unknown as never);
}

const CREATE_INPUT: CreateReportInput = {
  kind: 'lost',
  species: 'dog',
  contactPhone: '+100',
  lat: 1,
  lng: 2,
  eventDate: new Date('2026-05-01T00:00:00Z'),
};

describe('ReportsService', () => {
  it('create returns the owner projection with contact (Ok)', async () => {
    const res = await svc().create('user-1', CREATE_INPUT);
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.viewer).toBe('owner');
      expect(res.value.contactPhone).toBe('+100');
      expect(res.value.status).toBe('active');
    }
  });

  it('create surfaces DbError', async () => {
    const res = await svc({ insertFails: true }).create('user-1', CREATE_INPUT);
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });

  it('browse maps items to the public projection (Ok, no contact)', async () => {
    const res = await svc().browse({ page: 1, pageSize: 20 });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.total).toBe(1);
      expect(
        Object.prototype.hasOwnProperty.call(
          res.value.items[0],
          'contactPhone',
        ),
      ).toBe(false);
    }
  });

  it('browse surfaces DbError', async () => {
    const res = await svc({ browseFails: true }).browse({
      page: 1,
      pageSize: 20,
    });
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });

  it('getOne gives the public projection to a non-reporter (Ok)', async () => {
    const res = await svc({ found: RECORD }).getOne('intruder', 'rep-1');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value.viewer).toBe('public');
  });

  it('getOne gives the owner projection to the reporter (Ok)', async () => {
    const res = await svc({ found: RECORD }).getOne('user-1', 'rep-1');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.viewer).toBe('owner');
      if (res.value.viewer === 'owner')
        expect(res.value.contactEmail).toBe('a@b.com');
    }
  });

  it('getOne returns NotFound when missing', async () => {
    const res = await svc({ found: null }).getOne(null, 'nope');
    expect(res.isErr() && res.error.tag).toBe('NotFound');
  });

  it('getOne surfaces DbError', async () => {
    const res = await svc({ findFails: true }).getOne(null, 'rep-1');
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });

  it('update by the reporter mutates fields (Ok)', async () => {
    const res = await svc({ found: RECORD }).update('user-1', 'rep-1', {
      name: 'Buddy',
    });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value.name).toBe('Buddy');
  });

  it('update by a non-reporter returns Forbidden', async () => {
    const res = await svc({ found: RECORD }).update('intruder', 'rep-1', {
      name: 'X',
    });
    expect(res.isErr() && res.error.tag).toBe('Forbidden');
  });

  it('update returns NotFound when missing', async () => {
    const res = await svc({ found: null }).update('user-1', 'nope', {
      name: 'X',
    });
    expect(res.isErr() && res.error.tag).toBe('NotFound');
  });

  it('update surfaces DbError from the write', async () => {
    const res = await svc({ found: RECORD, updateFails: true }).update(
      'user-1',
      'rep-1',
      { name: 'X' },
    );
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });
});
