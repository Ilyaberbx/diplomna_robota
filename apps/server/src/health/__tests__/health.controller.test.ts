import { Controller, Get, Module, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuthModule, CurrentUser } from '../../auth/index.js';
import type { AuthenticatedUser } from '../../auth/index.js';
import { ConfigModule } from '../../config/config.module.js';
import { DomainExceptionFilter } from '../../shared/http/domain-exception.filter.js';
import { HealthModule } from '../index.js';

// Non-@Public() route: proves the global default-deny guard rejects
// requests without a bearer token (401).
@Controller('protected-probe')
class ProtectedProbeController {
  @Get()
  me(@CurrentUser() user: AuthenticatedUser): { id: string } {
    return { id: user.id };
  }
}

@Module({ controllers: [ProtectedProbeController] })
class ProtectedProbeModule {}

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgres://u:p@localhost:5432/test';
    process.env.AUTH_JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, AuthModule, HealthModule, ProtectedProbeModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health is public and returns { status: "ok" }', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ status: 'ok' });
      });
  });

  it('default-deny: non-@Public() route returns 401 without a token', async () => {
    await request(app.getHttpServer())
      .get('/protected-probe')
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });
  });
});
