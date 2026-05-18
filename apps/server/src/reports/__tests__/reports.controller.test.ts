import { type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConfigModule } from '../../config/config.module.js';
import { JwtAuthGuard } from '../../auth/jwt.guard.js';
import { DomainExceptionFilter } from '../../shared/http/domain-exception.filter.js';
import { ReportsController } from '../reports.controller.js';
import { ReportsRepository } from '../reports.repository.js';
import { ReportsService } from '../reports.service.js';
import {
  createPostgresTestDb,
  type TestDb,
} from '../../test-utils/postgres-test-db.js';
import { AuthRepository } from '../../auth/auth.repository.js';
import { DRIZZLE } from '../../db/db.module.js';
import request from 'supertest';

function tokenFor(id: string): string {
  return jwt.sign({ sub: id, email: `${id}@example.com` }, 'test-secret');
}

describe('ReportsController (HTTP, real Postgres)', () => {
  let app: INestApplication;
  let testDb: TestDb;
  let reporterId: string;
  let otherId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgres://u:p@localhost:5432/test';
    process.env.AUTH_JWT_SECRET = 'test-secret';
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
        { provide: DRIZZLE, useValue: testDb.db },
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
});
