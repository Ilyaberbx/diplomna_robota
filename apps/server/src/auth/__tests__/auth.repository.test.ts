import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPostgresTestDb, type TestDb } from '../../test-utils/postgres-test-db.js';
import { AuthRepository } from '../auth.repository.js';

describe('AuthRepository (ephemeral Postgres)', () => {
  let testDb: TestDb;
  let repo: AuthRepository;

  beforeAll(async () => {
    testDb = await createPostgresTestDb();
    repo = new AuthRepository(testDb.db);
  });

  afterAll(async () => {
    await testDb.stop();
  });

  it('insert + findByEmail returns the stored user (Ok)', async () => {
    const created = await repo.insert({
      email: 'owner@example.com',
      passwordHash: 'hash-1',
    });
    expect(created.isOk()).toBe(true);
    const id = created._unsafeUnwrap().id;

    const found = (await repo.findByEmail('owner@example.com'))._unsafeUnwrap();
    expect(found?.id).toBe(id);
    expect(found?.passwordHash).toBe('hash-1');
  });

  it('findByEmail returns null for an unknown email (Ok)', async () => {
    const found = (await repo.findByEmail('nobody@example.com'))._unsafeUnwrap();
    expect(found).toBeNull();
  });

  it('findById returns the stored user (Ok)', async () => {
    const created = (
      await repo.insert({ email: 'byid@example.com', passwordHash: 'h' })
    )._unsafeUnwrap();
    const found = (await repo.findById(created.id))._unsafeUnwrap();
    expect(found?.email).toBe('byid@example.com');
  });

  it('insert with a duplicate email yields DbError', async () => {
    await repo.insert({ email: 'dup@example.com', passwordHash: 'h' });
    const second = await repo.insert({
      email: 'dup@example.com',
      passwordHash: 'h',
    });
    expect(second.isErr()).toBe(true);
    if (second.isErr()) expect(second.error.tag).toBe('DbError');
  });
});
