import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { dbError, notFound, type DbError, type NotFound } from '../../shared/errors.js';
import type { OwnerReport, ReportRecord } from '../../reports/index.js';
import { MatchesService } from '../matches.service.js';
import type {
  CreateMatchData,
  MatchRecord,
  MatchStatus,
} from '../matches.types.js';

const LOST: ReportRecord = {
  id: 'lost-1',
  kind: 'lost',
  reporterId: 'owner',
  status: 'active',
  species: 'dog',
  breed: null,
  name: 'Rex',
  color: null,
  description: null,
  photoKey: null,
  contactPhone: '+lost',
  contactEmail: 'owner@x.com',
  lat: 1,
  lng: 2,
  eventDate: new Date('2026-05-01T00:00:00Z'),
  createdAt: new Date('2026-05-01T00:00:00Z'),
  updatedAt: new Date('2026-05-01T00:00:00Z'),
};

const FOUND: ReportRecord = {
  ...LOST,
  id: 'found-1',
  kind: 'found',
  reporterId: 'finder',
  contactPhone: '+found',
  contactEmail: 'finder@x.com',
};

const MATCH: MatchRecord = {
  id: 'match-1',
  lostReportId: 'lost-1',
  foundReportId: 'found-1',
  proposedBy: 'owner',
  status: 'proposed',
  createdAt: new Date('2026-05-02T00:00:00Z'),
  resolvedAt: null,
};

type ReportsBehaviour = {
  records?: Record<string, ReportRecord>;
  getFails?: boolean;
};

class FakeReports {
  constructor(private readonly b: ReportsBehaviour = {}) {}

  getRecord(id: string): ResultAsync<ReportRecord, NotFound | DbError> {
    if (this.b.getFails) return errAsync(dbError('get'));
    const r = (this.b.records ?? {})[id];
    return r ? okAsync(r) : errAsync(notFound('report', id));
  }

  revealContact(id: string): ResultAsync<OwnerReport, NotFound | DbError> {
    const r = (this.b.records ?? {})[id];
    if (!r) return errAsync(notFound('report', id));
    return okAsync({
      id: r.id,
      kind: r.kind,
      reporterId: r.reporterId,
      status: r.status,
      species: r.species,
      breed: r.breed,
      name: r.name,
      color: r.color,
      description: r.description,
      photoKey: r.photoKey,
      lat: r.lat,
      lng: r.lng,
      eventDate: r.eventDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      viewer: 'owner',
      contactPhone: r.contactPhone,
      contactEmail: r.contactEmail,
    });
  }

  publicById(): never {
    throw new Error('unused');
  }

  browsePublic(): never {
    throw new Error('unused');
  }
}

type RepoBehaviour = {
  pair?: MatchRecord | null;
  match?: MatchRecord | null;
  insertFails?: boolean;
  findPairFails?: boolean;
  findByIdFails?: boolean;
  resolveFails?: boolean;
};

class FakeRepo {
  constructor(private readonly b: RepoBehaviour = {}) {}

  insert(data: CreateMatchData): ResultAsync<MatchRecord, DbError> {
    if (this.b.insertFails) return errAsync(dbError('insert'));
    return okAsync({
      ...MATCH,
      lostReportId: data.lostReportId,
      foundReportId: data.foundReportId,
      proposedBy: data.proposedBy,
    });
  }

  findById(_id: string): ResultAsync<MatchRecord | null, DbError> {
    if (this.b.findByIdFails) return errAsync(dbError('findById'));
    return okAsync(this.b.match ?? null);
  }

  findPair(): ResultAsync<MatchRecord | null, DbError> {
    if (this.b.findPairFails) return errAsync(dbError('findPair'));
    return okAsync(this.b.pair ?? null);
  }

  findForReport(_id: string): ResultAsync<MatchRecord[], DbError> {
    return okAsync([MATCH]);
  }

  resolve(
    id: string,
    status: Extract<MatchStatus, 'confirmed' | 'rejected'>,
  ): ResultAsync<MatchRecord, DbError> {
    if (this.b.resolveFails) return errAsync(dbError('resolve'));
    return okAsync({ ...MATCH, id, status, resolvedAt: new Date() });
  }
}

function svc(rb: RepoBehaviour = {}, reb: ReportsBehaviour = {}): MatchesService {
  return new MatchesService(
    new FakeRepo(rb) as unknown as never,
    new FakeReports(reb) as unknown as never,
  );
}

const BOTH = { records: { 'lost-1': LOST, 'found-1': FOUND } };

describe('MatchesService', () => {
  it('propose by an owner of a side returns the proposed match (Ok)', async () => {
    const res = await svc({}, BOTH).propose('owner', 'lost-1', 'found-1');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.status).toBe('proposed');
      expect(res.value.proposedBy).toBe('owner');
    }
  });

  it('propose without owning either side returns Forbidden', async () => {
    const res = await svc({}, BOTH).propose('stranger', 'lost-1', 'found-1');
    expect(res.isErr() && res.error.tag).toBe('Forbidden');
  });

  it('propose with a swapped (non lost/found) pair returns Forbidden', async () => {
    const res = await svc({}, BOTH).propose('owner', 'found-1', 'lost-1');
    expect(res.isErr() && res.error.tag).toBe('Forbidden');
  });

  it('propose a duplicate pair returns Conflict', async () => {
    const res = await svc({ pair: MATCH }, BOTH).propose(
      'owner',
      'lost-1',
      'found-1',
    );
    expect(res.isErr() && res.error.tag).toBe('Conflict');
  });

  it('propose returns NotFound when a side is missing', async () => {
    const res = await svc({}, { records: { 'lost-1': LOST } }).propose(
      'owner',
      'lost-1',
      'found-1',
    );
    expect(res.isErr() && res.error.tag).toBe('NotFound');
  });

  it('propose surfaces DbError from the insert', async () => {
    const res = await svc({ insertFails: true }, BOTH).propose(
      'owner',
      'lost-1',
      'found-1',
    );
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });

  it('listForReport returns the matches (Ok)', async () => {
    const res = await svc().listForReport('lost-1');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value).toHaveLength(1);
  });

  it('confirm by the non-proposing reporter reveals both contacts (Ok)', async () => {
    const res = await svc({ match: MATCH }, BOTH).confirm('finder', 'match-1');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.status).toBe('confirmed');
      expect(res.value.lostReport.contactPhone).toBe('+lost');
      expect(res.value.foundReport.contactEmail).toBe('finder@x.com');
    }
  });

  it('confirm by the proposer returns Forbidden', async () => {
    const res = await svc({ match: MATCH }, BOTH).confirm('owner', 'match-1');
    expect(res.isErr() && res.error.tag).toBe('Forbidden');
  });

  it('confirm an unknown match returns NotFound', async () => {
    const res = await svc({ match: null }, BOTH).confirm('finder', 'nope');
    expect(res.isErr() && res.error.tag).toBe('NotFound');
  });

  it('confirm an already-resolved match returns Conflict', async () => {
    const res = await svc(
      { match: { ...MATCH, status: 'confirmed' } },
      BOTH,
    ).confirm('finder', 'match-1');
    expect(res.isErr() && res.error.tag).toBe('Conflict');
  });

  it('confirm surfaces DbError from the resolve', async () => {
    const res = await svc(
      { match: MATCH, resolveFails: true },
      BOTH,
    ).confirm('finder', 'match-1');
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });

  it('reject by the non-proposing reporter resolves to rejected (Ok)', async () => {
    const res = await svc({ match: MATCH }, BOTH).reject('finder', 'match-1');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value.status).toBe('rejected');
  });

  it('reject by the proposer returns Forbidden', async () => {
    const res = await svc({ match: MATCH }, BOTH).reject('owner', 'match-1');
    expect(res.isErr() && res.error.tag).toBe('Forbidden');
  });

  it('reject an unknown match returns NotFound', async () => {
    const res = await svc({ match: null }, BOTH).reject('finder', 'nope');
    expect(res.isErr() && res.error.tag).toBe('NotFound');
  });

  it('reject an already-resolved match returns Conflict', async () => {
    const res = await svc(
      { match: { ...MATCH, status: 'rejected' } },
      BOTH,
    ).reject('finder', 'match-1');
    expect(res.isErr() && res.error.tag).toBe('Conflict');
  });

  it('reject surfaces DbError from findById', async () => {
    const res = await svc({ findByIdFails: true }, BOTH).reject(
      'finder',
      'match-1',
    );
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });
});
