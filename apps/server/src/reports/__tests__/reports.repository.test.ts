import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPostgresTestDb,
  type TestDb,
} from '../../test-utils/postgres-test-db.js';
import { AuthRepository } from '../../auth/auth.repository.js';
import { ReportsRepository } from '../reports.repository.js';
import type { CreateReportData } from '../reports.types.js';

function makeData(
  reporterId: string,
  over: Partial<CreateReportData> = {},
): CreateReportData {
  return {
    reporterId,
    kind: 'lost',
    species: 'dog',
    status: 'active',
    breed: null,
    name: 'Rex',
    color: 'brown',
    description: null,
    contactPhone: '+100',
    contactEmail: 'a@b.com',
    lat: 50.45,
    lng: 30.52,
    eventDate: new Date('2026-05-01T00:00:00Z'),
    ...over,
  };
}

describe('ReportsRepository (ephemeral Postgres)', () => {
  let testDb: TestDb;
  let repo: ReportsRepository;
  let reporterId: string;
  let otherId: string;

  beforeAll(async () => {
    testDb = await createPostgresTestDb();
    repo = new ReportsRepository(testDb.db);
    const auth = new AuthRepository(testDb.db);
    reporterId = (
      await auth.insert({ email: 'r@example.com', passwordHash: 'h' })
    )._unsafeUnwrap().id;
    otherId = (
      await auth.insert({ email: 'o@example.com', passwordHash: 'h' })
    )._unsafeUnwrap().id;
  });

  afterAll(async () => {
    await testDb.stop();
  });

  it('insert + findById round-trips (Ok)', async () => {
    const created = (await repo.insert(makeData(reporterId)))._unsafeUnwrap();
    const found = (await repo.findById(created.id))._unsafeUnwrap();
    expect(found?.name).toBe('Rex');
    expect(found?.contactEmail).toBe('a@b.com');
    expect(found?.status).toBe('active');
  });

  it('findById returns null for unknown id (Ok)', async () => {
    const found = (
      await repo.findById('00000000-0000-0000-0000-000000000000')
    )._unsafeUnwrap();
    expect(found).toBeNull();
  });

  it('insert with a non-existent reporter yields DbError', async () => {
    const res = await repo.insert(
      makeData('00000000-0000-0000-0000-000000000000'),
    );
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect(res.error.tag).toBe('DbError');
  });

  it('update changes mutable fields (Ok)', async () => {
    const created = (await repo.insert(makeData(reporterId)))._unsafeUnwrap();
    const updated = (
      await repo.update(created.id, { name: 'Buddy', color: 'black' })
    )._unsafeUnwrap();
    expect(updated.name).toBe('Buddy');
    expect(updated.color).toBe('black');
  });

  it('updateStatus persists the new status (Ok)', async () => {
    const created = (await repo.insert(makeData(reporterId)))._unsafeUnwrap();
    const updated = (
      await repo.updateStatus(created.id, 'closed')
    )._unsafeUnwrap();
    expect(updated.status).toBe('closed');
  });

  it('browse filters by kind, species, status, date range and paginates', async () => {
    await repo.insert(
      makeData(reporterId, { kind: 'found', species: 'cat' }),
    );
    await repo.insert(
      makeData(otherId, {
        kind: 'lost',
        species: 'bird',
        eventDate: new Date('2020-01-01T00:00:00Z'),
      }),
    );

    const lostDogs = (
      await repo.browse({ kind: 'lost', species: 'dog', page: 1, pageSize: 50 })
    )._unsafeUnwrap();
    expect(lostDogs.items.every((r) => r.kind === 'lost')).toBe(true);
    expect(lostDogs.items.every((r) => r.species === 'dog')).toBe(true);
    expect(lostDogs.total).toBe(lostDogs.items.length);

    const recent = (
      await repo.browse({
        from: new Date('2026-01-01T00:00:00Z'),
        page: 1,
        pageSize: 50,
      })
    )._unsafeUnwrap();
    expect(
      recent.items.every(
        (r) => r.eventDate.getTime() >= new Date('2026-01-01').getTime(),
      ),
    ).toBe(true);

    const firstPage = (
      await repo.browse({ page: 1, pageSize: 2 })
    )._unsafeUnwrap();
    expect(firstPage.items.length).toBe(2);
    expect(firstPage.total).toBeGreaterThan(2);
  });

  it('browse area+radius keeps near points and drops far ones', async () => {
    const near = (
      await repo.insert(makeData(reporterId, { lat: 50.46, lng: 30.53 }))
    )._unsafeUnwrap();
    const far = (
      await repo.insert(makeData(reporterId, { lat: -33.86, lng: 151.2 }))
    )._unsafeUnwrap();

    const within = (
      await repo.browse({
        lat: 50.45,
        lng: 30.52,
        radiusKm: 10,
        page: 1,
        pageSize: 100,
      })
    )._unsafeUnwrap();
    const ids = within.items.map((r) => r.id);
    expect(ids).toContain(near.id);
    expect(ids).not.toContain(far.id);
  });

  it('findCandidates ranks opposite-kind by species, distance and date window', async () => {
    const subject = (
      await repo.insert(
        makeData(reporterId, {
          kind: 'lost',
          species: 'dog',
          lat: 50.45,
          lng: 30.52,
          eventDate: new Date('2026-05-10T00:00:00Z'),
        }),
      )
    )._unsafeUnwrap();

    // Best: opposite kind, species match, very close, same day.
    const best = (
      await repo.insert(
        makeData(otherId, {
          kind: 'found',
          species: 'dog',
          lat: 50.451,
          lng: 30.521,
          eventDate: new Date('2026-05-10T00:00:00Z'),
        }),
      )
    )._unsafeUnwrap();
    // Same species but ~5 km away and 3 days apart.
    const mid = (
      await repo.insert(
        makeData(otherId, {
          kind: 'found',
          species: 'dog',
          lat: 50.49,
          lng: 30.58,
          eventDate: new Date('2026-05-13T00:00:00Z'),
        }),
      )
    )._unsafeUnwrap();
    // Different species, close — ranked below same-species ones.
    const wrongSpecies = (
      await repo.insert(
        makeData(otherId, {
          kind: 'found',
          species: 'cat',
          lat: 50.451,
          lng: 30.521,
          eventDate: new Date('2026-05-10T00:00:00Z'),
        }),
      )
    )._unsafeUnwrap();
    // Same kind as subject — must be excluded.
    const sameKind = (
      await repo.insert(
        makeData(otherId, {
          kind: 'lost',
          species: 'dog',
          lat: 50.451,
          lng: 30.521,
          eventDate: new Date('2026-05-10T00:00:00Z'),
        }),
      )
    )._unsafeUnwrap();

    const candidates = (
      await repo.findCandidates(subject)
    )._unsafeUnwrap();
    const ids = candidates.map((c) => c.report.id);

    expect(ids).not.toContain(sameKind.id);
    expect(ids).not.toContain(subject.id);
    expect(ids).toContain(best.id);
    expect(ids.indexOf(best.id)).toBeLessThan(ids.indexOf(mid.id));
    expect(ids.indexOf(mid.id)).toBeLessThan(ids.indexOf(wrongSpecies.id));

    const bestC = candidates.find((c) => c.report.id === best.id);
    expect(bestC?.speciesMatch).toBe(true);
    expect(bestC?.distanceKm).toBeLessThan(1);
    expect(bestC?.daysApart).toBe(0);
    const wrongC = candidates.find((c) => c.report.id === wrongSpecies.id);
    expect(wrongC?.speciesMatch).toBe(false);
  });
});
