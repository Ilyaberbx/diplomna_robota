import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPostgresTestDb,
  type TestDb,
} from '../../test-utils/postgres-test-db.js';
import { AuthRepository } from '../../auth/auth.repository.js';
import { ReportsRepository } from '../../reports/reports.repository.js';
import { MatchesRepository } from '../matches.repository.js';

describe('MatchesRepository (ephemeral Postgres)', () => {
  let testDb: TestDb;
  let repo: MatchesRepository;
  let lostId: string;
  let foundId: string;
  let ownerId: string;

  beforeAll(async () => {
    testDb = await createPostgresTestDb();
    repo = new MatchesRepository(testDb.db);
    const auth = new AuthRepository(testDb.db);
    const reports = new ReportsRepository(testDb.db);
    const owner = (
      await auth.insert({ email: 'o@x.com', passwordHash: 'h' })
    )._unsafeUnwrap();
    const finder = (
      await auth.insert({ email: 'f@x.com', passwordHash: 'h' })
    )._unsafeUnwrap();
    ownerId = owner.id;
    lostId = (
      await reports.insert({
        reporterId: owner.id,
        kind: 'lost',
        species: 'dog',
        status: 'active',
        breed: null,
        name: 'Rex',
        color: null,
        description: null,
        contactPhone: '+1',
        contactEmail: 'o@x.com',
        lat: 1,
        lng: 2,
        eventDate: new Date('2026-05-01T00:00:00Z'),
      })
    )._unsafeUnwrap().id;
    foundId = (
      await reports.insert({
        reporterId: finder.id,
        kind: 'found',
        species: 'dog',
        status: 'active',
        breed: null,
        name: null,
        color: null,
        description: null,
        contactPhone: '+2',
        contactEmail: 'f@x.com',
        lat: 1,
        lng: 2,
        eventDate: new Date('2026-05-01T00:00:00Z'),
      })
    )._unsafeUnwrap().id;
  }, 120000);

  afterAll(async () => {
    await testDb.stop();
  });

  let matchId: string;

  it('insert creates a proposed match', async () => {
    const res = await repo.insert({
      lostReportId: lostId,
      foundReportId: foundId,
      proposedBy: ownerId,
    });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.status).toBe('proposed');
      expect(res.value.resolvedAt).toBeNull();
      matchId = res.value.id;
    }
  });

  it('findById returns the row', async () => {
    const res = await repo.findById(matchId);
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value?.id).toBe(matchId);
  });

  it('findById returns null for an unknown id', async () => {
    const res = await repo.findById('00000000-0000-0000-0000-000000000000');
    expect(res.isOk() && res._unsafeUnwrap()).toBeNull();
  });

  it('findPair finds the existing pair', async () => {
    const res = await repo.findPair(lostId, foundId);
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value?.id).toBe(matchId);
  });

  it('a duplicate (lost, found) pair violates the unique constraint (DbError)', async () => {
    const res = await repo.insert({
      lostReportId: lostId,
      foundReportId: foundId,
      proposedBy: ownerId,
    });
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });

  it('findForReport returns matches touching the report', async () => {
    const res = await repo.findForReport(foundId);
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value).toHaveLength(1);
  });

  it('resolve transitions status and stamps resolvedAt', async () => {
    const res = await repo.resolve(matchId, 'confirmed');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value.status).toBe('confirmed');
      expect(res.value.resolvedAt).not.toBeNull();
    }
  });

  it('countConfirmedForLost counts confirmed matches for the lost report', async () => {
    const res = await repo.countConfirmedForLost(lostId);
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value).toBe(1);
  });

  it('countConfirmedForLost is 0 for a lost report with no confirmed match', async () => {
    const res = await repo.countConfirmedForLost(
      '00000000-0000-0000-0000-000000000000',
    );
    expect(res.isOk() && res._unsafeUnwrap()).toBe(0);
  });
});
