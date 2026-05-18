import argon2 from 'argon2';
import { okAsync, type ResultAsync } from 'neverthrow';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AppConfig } from '../../config/config.js';
import { dbError, type DbError } from '../../shared/errors.js';
import type { CreateUserInput } from '../auth.repository.js';
import { AuthService } from '../auth.service.js';
import type { UserRecord } from '../auth.types.js';

class FakeAuthRepository {
  private rows: UserRecord[] = [];
  failNext: 'findByEmail' | 'findById' | 'insert' | null = null;

  findByEmail(email: string): ResultAsync<UserRecord | null, DbError> {
    if (this.failNext === 'findByEmail')
      return errOnce(this.clear()) as ResultAsync<null, DbError>;
    return okAsync(this.rows.find((r) => r.email === email) ?? null);
  }

  findById(id: string): ResultAsync<UserRecord | null, DbError> {
    if (this.failNext === 'findById')
      return errOnce(this.clear()) as ResultAsync<null, DbError>;
    return okAsync(this.rows.find((r) => r.id === id) ?? null);
  }

  insert(input: CreateUserInput): ResultAsync<UserRecord, DbError> {
    if (this.failNext === 'insert')
      return errOnce(this.clear()) as ResultAsync<UserRecord, DbError>;
    const row: UserRecord = {
      id: `id-${this.rows.length + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: new Date(),
    };
    this.rows.push(row);
    return okAsync(row);
  }

  seed(row: UserRecord): void {
    this.rows.push(row);
  }

  private clear(): true {
    this.failNext = null;
    return true;
  }
}

import { errAsync } from 'neverthrow';
function errOnce(_: true): ResultAsync<never, DbError> {
  return errAsync(dbError(new Error('boom')));
}

const cfg = { authJwtSecret: 'test-secret', authJwtTtl: '7d' } as AppConfig;

describe('AuthService', () => {
  let repo: FakeAuthRepository;
  let svc: AuthService;

  beforeEach(() => {
    repo = new FakeAuthRepository();
    svc = new AuthService(repo as unknown as never, cfg);
  });

  it('register: Ok returns token + user, never the hash', async () => {
    const res = await svc.register({
      email: 'a@example.com',
      password: 'password123',
    });
    expect(res.isOk()).toBe(true);
    const value = res._unsafeUnwrap();
    expect(value.token.length).toBeGreaterThan(0);
    expect(value.user.email).toBe('a@example.com');
    expect(JSON.stringify(value)).not.toContain('passwordHash');
    expect(JSON.stringify(value)).not.toContain('password123');
  });

  it('register: EmailTaken on duplicate email', async () => {
    await svc.register({ email: 'dup@example.com', password: 'password123' });
    const res = await svc.register({
      email: 'dup@example.com',
      password: 'password123',
    });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect(res.error.tag).toBe('EmailTaken');
  });

  it('register: DbError bubbles from the repository', async () => {
    repo.failNext = 'findByEmail';
    const res = await svc.register({
      email: 'x@example.com',
      password: 'password123',
    });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect(res.error.tag).toBe('DbError');
  });

  it('login: Ok returns token + user for correct credentials', async () => {
    const hash = await argon2.hash('password123', { type: argon2.argon2id });
    repo.seed({
      id: 'id-1',
      email: 'login@example.com',
      passwordHash: hash,
      createdAt: new Date(),
    });
    const res = await svc.login({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value.user.id).toBe('id-1');
  });

  it('login: InvalidCredentials for unknown email', async () => {
    const res = await svc.login({
      email: 'ghost@example.com',
      password: 'password123',
    });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect(res.error.tag).toBe('InvalidCredentials');
  });

  it('login: InvalidCredentials for wrong password', async () => {
    const hash = await argon2.hash('password123', { type: argon2.argon2id });
    repo.seed({
      id: 'id-1',
      email: 'login@example.com',
      passwordHash: hash,
      createdAt: new Date(),
    });
    const res = await svc.login({
      email: 'login@example.com',
      password: 'wrong-password',
    });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect(res.error.tag).toBe('InvalidCredentials');
  });

  it('login: DbError bubbles from the repository', async () => {
    repo.failNext = 'findByEmail';
    const res = await svc.login({
      email: 'x@example.com',
      password: 'password123',
    });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect(res.error.tag).toBe('DbError');
  });

  it('me: Ok returns the public user', async () => {
    repo.seed({
      id: 'id-1',
      email: 'me@example.com',
      passwordHash: 'h',
      createdAt: new Date(),
    });
    const res = await svc.me('id-1');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) expect(res.value).toEqual({ id: 'id-1', email: 'me@example.com' });
  });

  it('me: NotFound when the id is unknown', async () => {
    const res = await svc.me('missing');
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect(res.error.tag).toBe('NotFound');
  });

  it('me: DbError bubbles from the repository', async () => {
    repo.failNext = 'findById';
    const res = await svc.me('id-1');
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect(res.error.tag).toBe('DbError');
  });
});
