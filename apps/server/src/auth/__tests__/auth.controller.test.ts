import { type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConfigModule } from '../../config/config.module.js';
import {
  emailTaken,
  invalidCredentials,
  notFound,
  type EmailTaken,
  type InvalidCredentials,
  type NotFound,
} from '../auth.errors.js';
import { AuthController } from '../auth.controller.js';
import { AuthService } from '../auth.service.js';
import { JwtAuthGuard } from '../jwt.guard.js';
import { DomainExceptionFilter } from '../../shared/http/domain-exception.filter.js';
import type { DbError } from '../../shared/errors.js';
import type { Credentials } from '../auth.dto.js';
import type { AuthResult, PublicUser } from '../auth.types.js';

const VALID_TOKEN_USER = { id: 'user-1', email: 'me@example.com' };

class FakeAuthService {
  register(
    input: Credentials,
  ): ResultAsync<AuthResult, EmailTaken | DbError> {
    if (input.email === 'taken@example.com')
      return errAsync(emailTaken(input.email));
    return okAsync({ token: 'tok', user: { id: 'user-1', email: input.email } });
  }

  login(
    input: Credentials,
  ): ResultAsync<AuthResult, InvalidCredentials | DbError> {
    if (input.password === 'wrong-password')
      return errAsync(invalidCredentials());
    return okAsync({ token: 'tok', user: { id: 'user-1', email: input.email } });
  }

  me(actorId: string): ResultAsync<PublicUser, NotFound | DbError> {
    if (actorId === 'user-1') return okAsync(VALID_TOKEN_USER);
    return errAsync(notFound('user', actorId));
  }
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgres://u:p@localhost:5432/test';
    process.env.AUTH_JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useClass: FakeAuthService },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register returns { token, user }', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'password123' })
      .expect(201)
      .expect((res) => {
        expect(res.body.token).toBe('tok');
        expect(res.body.user.email).toBe('new@example.com');
      });
  });

  it('POST /auth/register with a duplicate email returns 409 EMAIL_TAKEN', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'taken@example.com', password: 'password123' })
      .expect(409)
      .expect((res) => {
        expect(res.body.error.code).toBe('EMAIL_TAKEN');
      });
  });

  it('POST /auth/register with a bad body returns 400 VALIDATION', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'x' })
      .expect(400)
      .expect((res) => {
        expect(res.body.error.code).toBe('VALIDATION');
      });
  });

  it('POST /auth/login returns { token, user }', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'me@example.com', password: 'password123' })
      .expect(201)
      .expect((res) => {
        expect(res.body.token).toBe('tok');
      });
  });

  it('POST /auth/login with wrong credentials returns 401 INVALID_CREDENTIALS', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'me@example.com', password: 'wrong-password' })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      });
  });

  it('GET /auth/me without a token returns 401', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });
  });

  it('GET /auth/me with a valid token returns the current user', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign(
      { sub: 'user-1', email: 'me@example.com' },
      'test-secret',
    );
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(VALID_TOKEN_USER);
      });
  });
});
