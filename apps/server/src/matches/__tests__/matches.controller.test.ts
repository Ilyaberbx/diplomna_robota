import { type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ConfigModule } from '../../config/config.module.js';
import { JwtAuthGuard } from '../../auth/jwt.guard.js';
import { DomainExceptionFilter } from '../../shared/http/domain-exception.filter.js';
import { DRIZZLE } from '../../db/db.module.js';
import { AuthRepository } from '../../auth/auth.repository.js';
import { ReportsRepository } from '../../reports/reports.repository.js';
import { ReportsService } from '../../reports/reports.service.js';
import { REPORTS_READER } from '../../reports/index.js';
import { STORAGE_CLIENT } from '../../storage/index.js';
import { LocalFsStorageClient } from '../../storage/storage.adapter.js';
import {
  createPostgresTestDb,
  type TestDb,
} from '../../test-utils/postgres-test-db.js';
import { MatchesController } from '../matches.controller.js';
import { MatchesService } from '../matches.service.js';
import { MatchesRepository } from '../matches.repository.js';

function tokenFor(id: string): string {
  return jwt.sign({ sub: id, email: `${id}@example.com` }, 'test-secret');
}

describe('MatchesController (HTTP, real Postgres)', () => {
  let app: INestApplication;
  let testDb: TestDb;
  let ownerId: string;
  let finderId: string;
  let strangerId: string;
  let lostId: string;
  let foundId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgres://u:p@localhost:5432/test';
    process.env.AUTH_JWT_SECRET = 'test-secret';
    process.env.STORAGE_DIR = '/tmp';
    testDb = await createPostgresTestDb();
    const auth = new AuthRepository(testDb.db);
    const reports = new ReportsRepository(testDb.db);
    ownerId = (
      await auth.insert({ email: 'owner@x.com', passwordHash: 'h' })
    )._unsafeUnwrap().id;
    finderId = (
      await auth.insert({ email: 'finder@x.com', passwordHash: 'h' })
    )._unsafeUnwrap().id;
    strangerId = (
      await auth.insert({ email: 'stranger@x.com', passwordHash: 'h' })
    )._unsafeUnwrap().id;
    lostId = (
      await reports.insert({
        reporterId: ownerId,
        kind: 'lost',
        species: 'dog',
        status: 'active',
        breed: null,
        name: 'Rex',
        color: null,
        description: null,
        contactPhone: '+lost-secret',
        contactEmail: 'owner-secret@x.com',
        lat: 1,
        lng: 2,
        eventDate: new Date('2026-05-01T00:00:00Z'),
      })
    )._unsafeUnwrap().id;
    foundId = (
      await reports.insert({
        reporterId: finderId,
        kind: 'found',
        species: 'dog',
        status: 'active',
        breed: null,
        name: null,
        color: null,
        description: null,
        contactPhone: '+found-secret',
        contactEmail: 'finder-secret@x.com',
        lat: 1,
        lng: 2,
        eventDate: new Date('2026-05-01T00:00:00Z'),
      })
    )._unsafeUnwrap().id;

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [MatchesController],
      providers: [
        MatchesService,
        MatchesRepository,
        ReportsService,
        ReportsRepository,
        { provide: REPORTS_READER, useExisting: ReportsService },
        { provide: DRIZZLE, useValue: testDb.db },
        { provide: STORAGE_CLIENT, useClass: LocalFsStorageClient },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  }, 120000);

  afterAll(async () => {
    await app.close();
    await testDb.stop();
  });

  let matchId: string;

  it('POST /matches without a token is rejected', async () => {
    await request(app.getHttpServer())
      .post('/matches')
      .send({ lostReportId: lostId, foundReportId: foundId })
      .expect(401);
  });

  it('POST /matches by a non-owner of either side is 403 FORBIDDEN', async () => {
    await request(app.getHttpServer())
      .post('/matches')
      .set('Authorization', `Bearer ${tokenFor(strangerId)}`)
      .send({ lostReportId: lostId, foundReportId: foundId })
      .expect(403)
      .expect((res) => expect(res.body.error.code).toBe('FORBIDDEN'));
  });

  it('POST /matches by the owner proposes a match (proposed, no contact)', async () => {
    await request(app.getHttpServer())
      .post('/matches')
      .set('Authorization', `Bearer ${tokenFor(ownerId)}`)
      .send({ lostReportId: lostId, foundReportId: foundId })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('proposed');
        expect(res.body).not.toHaveProperty('lostReport');
        matchId = res.body.id;
      });
  });

  it('POST /matches for a duplicate pair is 409 CONFLICT', async () => {
    await request(app.getHttpServer())
      .post('/matches')
      .set('Authorization', `Bearer ${tokenFor(ownerId)}`)
      .send({ lostReportId: lostId, foundReportId: foundId })
      .expect(409)
      .expect((res) => expect(res.body.error.code).toBe('CONFLICT'));
  });

  it('GET /matches?reportId= lists matches for the report', async () => {
    await request(app.getHttpServer())
      .get(`/matches?reportId=${lostId}`)
      .set('Authorization', `Bearer ${tokenFor(ownerId)}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0]).not.toHaveProperty('lostReport');
      });
  });

  it('POST /matches/:id/confirm by the proposer is 403 FORBIDDEN', async () => {
    await request(app.getHttpServer())
      .post(`/matches/${matchId}/confirm`)
      .set('Authorization', `Bearer ${tokenFor(ownerId)}`)
      .expect(403)
      .expect((res) => expect(res.body.error.code).toBe('FORBIDDEN'));
  });

  it('POST /matches/:id/confirm by the non-proposing reporter reveals both contacts', async () => {
    await request(app.getHttpServer())
      .post(`/matches/${matchId}/confirm`)
      .set('Authorization', `Bearer ${tokenFor(finderId)}`)
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('confirmed');
        expect(res.body.lostReport.contactPhone).toBe('+lost-secret');
        expect(res.body.lostReport.contactEmail).toBe('owner-secret@x.com');
        expect(res.body.foundReport.contactPhone).toBe('+found-secret');
        expect(res.body.lostReport.viewer).toBe('owner');
      });
  });

  it('a confirmed match still strips contact from the browse projection', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [],
      providers: [
        ReportsService,
        ReportsRepository,
        { provide: DRIZZLE, useValue: testDb.db },
        { provide: STORAGE_CLIENT, useClass: LocalFsStorageClient },
      ],
    }).compile();
    const reports = moduleRef.get(ReportsService);
    const page = (
      await reports.browse({ page: 1, pageSize: 20 })
    )._unsafeUnwrap();
    for (const item of page.items) {
      expect(item).not.toHaveProperty('contactPhone');
      expect(item).not.toHaveProperty('contactEmail');
    }
  });

  it('POST /matches/:id/confirm on a resolved match is 409 CONFLICT', async () => {
    await request(app.getHttpServer())
      .post(`/matches/${matchId}/confirm`)
      .set('Authorization', `Bearer ${tokenFor(finderId)}`)
      .expect(409)
      .expect((res) => expect(res.body.error.code).toBe('CONFLICT'));
  });

  it('POST /matches/:id/reject for an unknown match is 404', async () => {
    await request(app.getHttpServer())
      .post('/matches/00000000-0000-0000-0000-000000000000/reject')
      .set('Authorization', `Bearer ${tokenFor(finderId)}`)
      .expect(404);
  });
});
