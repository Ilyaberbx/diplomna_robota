import { type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConfigModule } from '../../config/config.module.js';
import { JwtAuthGuard } from '../../auth/jwt.guard.js';
import { DomainExceptionFilter } from '../../shared/http/domain-exception.filter.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ReportsController } from '../reports.controller.js';
import { ReportsRepository } from '../reports.repository.js';
import { ReportsService } from '../reports.service.js';
import { LocalFsStorageClient } from '../../storage/storage.adapter.js';
import { STORAGE_CLIENT } from '../../storage/index.js';
import {
  createPostgresTestDb,
  type TestDb,
} from '../../test-utils/postgres-test-db.js';
import { AuthRepository } from '../../auth/auth.repository.js';
import { DRIZZLE } from '../../db/db.module.js';
import { MatchesRepository } from '../../matches/matches.repository.js';
import {
  MATCHES_READER,
  MatchConfirmationReader,
} from '../../matches/matches.ports.js';
import request from 'supertest';

function tokenFor(id: string): string {
  return jwt.sign({ sub: id, email: `${id}@example.com` }, 'test-secret');
}

describe('ReportsController (HTTP, real Postgres)', () => {
  let app: INestApplication;
  let testDb: TestDb;
  let reporterId: string;
  let otherId: string;
  let storageDir: string;

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'reports-photo-'));
    process.env.DATABASE_URL = 'postgres://u:p@localhost:5432/test';
    process.env.AUTH_JWT_SECRET = 'test-secret';
    process.env.STORAGE_DIR = storageDir;
    testDb = await createPostgresTestDb();
    const auth = new AuthRepository(testDb.db);
    reporterId = (
      await auth.insert({ email: 'rep@example.com', passwordHash: 'h' })
    )._unsafeUnwrap().id;
    otherId = (
      await auth.insert({ email: 'oth@example.com', passwordHash: 'h' })
    )._unsafeUnwrap().id;

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [ReportsController],
      providers: [
        ReportsService,
        ReportsRepository,
        MatchesRepository,
        { provide: MATCHES_READER, useClass: MatchConfirmationReader },
        { provide: DRIZZLE, useValue: testDb.db },
        { provide: STORAGE_CLIENT, useClass: LocalFsStorageClient },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await testDb.stop();
    await rm(storageDir, { recursive: true, force: true });
  });

  const body = {
    kind: 'lost',
    species: 'dog',
    name: 'Rex',
    contactPhone: '+1999',
    contactEmail: 'secret@owner.com',
    lat: 50.45,
    lng: 30.52,
    eventDate: '2026-05-01T00:00:00.000Z',
  };

  let createdId: string;

  it('POST /reports creates a report (owner projection has contact)', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .send(body)
      .expect(201)
      .expect((res) => {
        expect(res.body.viewer).toBe('owner');
        expect(res.body.contactEmail).toBe('secret@owner.com');
        createdId = res.body.id;
      });
  });

  it('POST /reports without a token is rejected', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .send(body)
      .expect(401);
  });

  it('POST /reports with a bad body returns 400 VALIDATION', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .send({ kind: 'lost' })
      .expect(400)
      .expect((res) => expect(res.body.error.code).toBe('VALIDATION'));
  });

  it('GET /reports is public and strips contact from every item', async () => {
    await request(app.getHttpServer())
      .get('/reports?kind=lost&species=dog')
      .expect(200)
      .expect((res) => {
        expect(res.body.items.length).toBeGreaterThan(0);
        for (const item of res.body.items) {
          expect(item).not.toHaveProperty('contactPhone');
          expect(item).not.toHaveProperty('contactEmail');
        }
        expect(res.body.total).toBeGreaterThan(0);
      });
  });

  it('GET /reports/:id returns the public projection anonymously', async () => {
    await request(app.getHttpServer())
      .get(`/reports/${createdId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.viewer).toBe('public');
        expect(res.body).not.toHaveProperty('contactEmail');
      });
  });

  it('GET /reports/:id returns the owner projection to the reporter', async () => {
    await request(app.getHttpServer())
      .get(`/reports/${createdId}`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.viewer).toBe('owner');
        expect(res.body.contactEmail).toBe('secret@owner.com');
      });
  });

  it('GET /reports/:id for an unknown id returns 404', async () => {
    await request(app.getHttpServer())
      .get('/reports/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('GET /reports/:id/candidates by the reporter returns ranked opposite-kind', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${tokenFor(otherId)}`)
      .send({
        kind: 'found',
        species: 'dog',
        contactPhone: '+1888',
        lat: 50.451,
        lng: 30.521,
        eventDate: '2026-05-01T00:00:00.000Z',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/reports/${createdId}/candidates`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        for (const c of res.body) {
          expect(c.report.kind).toBe('found');
          expect(c.report).not.toHaveProperty('contactPhone');
          expect(typeof c.distanceKm).toBe('number');
          expect(typeof c.speciesMatch).toBe('boolean');
        }
      });
  });

  it('GET /reports/:id/candidates by a non-reporter returns 403 FORBIDDEN', async () => {
    await request(app.getHttpServer())
      .get(`/reports/${createdId}/candidates`)
      .set('Authorization', `Bearer ${tokenFor(otherId)}`)
      .expect(403)
      .expect((res) => expect(res.body.error.code).toBe('FORBIDDEN'));
  });

  it('GET /reports/:id/candidates without a token is rejected', async () => {
    await request(app.getHttpServer())
      .get(`/reports/${createdId}/candidates`)
      .expect(401);
  });

  it('PATCH /reports/:id by the reporter edits mutable fields', async () => {
    await request(app.getHttpServer())
      .patch(`/reports/${createdId}`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .send({ name: 'Buddy' })
      .expect(200)
      .expect((res) => expect(res.body.name).toBe('Buddy'));
  });

  it('PATCH /reports/:id by a non-reporter returns 403 FORBIDDEN', async () => {
    await request(app.getHttpServer())
      .patch(`/reports/${createdId}`)
      .set('Authorization', `Bearer ${tokenFor(otherId)}`)
      .send({ name: 'Hacked' })
      .expect(403)
      .expect((res) => expect(res.body.error.code).toBe('FORBIDDEN'));
  });

  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  it('GET /reports/:id/photo is 404 before any upload', async () => {
    await request(app.getHttpServer())
      .get(`/reports/${createdId}/photo`)
      .expect(404);
  });

  it('POST /reports/:id/photo by a non-reporter is 403 FORBIDDEN', async () => {
    await request(app.getHttpServer())
      .post(`/reports/${createdId}/photo`)
      .set('Authorization', `Bearer ${tokenFor(otherId)}`)
      .attach('photo', pngBytes, { filename: 'p.png', contentType: 'image/png' })
      .expect(403)
      .expect((res) => expect(res.body.error.code).toBe('FORBIDDEN'));
  });

  it('POST /reports/:id/photo rejects a non-image with 415', async () => {
    await request(app.getHttpServer())
      .post(`/reports/${createdId}/photo`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .attach('photo', Buffer.from('not an image'), {
        filename: 'p.txt',
        contentType: 'text/plain',
      })
      .expect(415)
      .expect((res) =>
        expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE'),
      );
  });

  it('POST /reports/:id/photo by the reporter then GET streams it', async () => {
    await request(app.getHttpServer())
      .post(`/reports/${createdId}/photo`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .attach('photo', pngBytes, { filename: 'p.png', contentType: 'image/png' })
      .expect(201)
      .expect((res) => expect(res.body.photoKey).toBeTruthy());

    await request(app.getHttpServer())
      .get(`/reports/${createdId}/photo`)
      .responseType('blob')
      .expect(200)
      .expect('content-type', /image\/png/)
      // CORP must be relaxed so the client can embed this as a cross-origin
      // <img src> despite Helmet's global same-origin default.
      .expect('cross-origin-resource-policy', 'cross-origin')
      .expect((res) => {
        expect(Buffer.compare(res.body as Buffer, pngBytes)).toBe(0);
      });
  });

  async function freshLostId(): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/reports')
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .send(body);
    return res.body.id as string;
  }

  it('POST /reports/:id/status closes a Lost report for the reporter', async () => {
    const id = await freshLostId();
    await request(app.getHttpServer())
      .post(`/reports/${id}/status`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .send({ status: 'closed' })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('closed');
        expect(res.body.viewer).toBe('owner');
      });
  });

  it('POST /reports/:id/status by a non-reporter is 403 FORBIDDEN', async () => {
    const id = await freshLostId();
    await request(app.getHttpServer())
      .post(`/reports/${id}/status`)
      .set('Authorization', `Bearer ${tokenFor(otherId)}`)
      .send({ status: 'closed' })
      .expect(403)
      .expect((res) => expect(res.body.error.code).toBe('FORBIDDEN'));
  });

  it('POST /reports/:id/status with an illegal target is 409 INVALID_TRANSITION', async () => {
    const id = await freshLostId();
    await request(app.getHttpServer())
      .post(`/reports/${id}/status`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .send({ status: 'resolved' })
      .expect(409)
      .expect((res) =>
        expect(res.body.error.code).toBe('INVALID_TRANSITION'),
      );
  });

  it('POST /reports/:id/status reunited without a confirmed Match is 409', async () => {
    const id = await freshLostId();
    await request(app.getHttpServer())
      .post(`/reports/${id}/status`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .send({ status: 'reunited' })
      .expect(409)
      .expect((res) =>
        expect(res.body.error.code).toBe('INVALID_TRANSITION'),
      );
  });

  it('POST /reports/:id/status with a bad body returns 400 VALIDATION', async () => {
    const id = await freshLostId();
    await request(app.getHttpServer())
      .post(`/reports/${id}/status`)
      .set('Authorization', `Bearer ${tokenFor(reporterId)}`)
      .send({ status: 'active' })
      .expect(400)
      .expect((res) => expect(res.body.error.code).toBe('VALIDATION'));
  });
});
