import { errAsync, okAsync, type ResultAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { dbError, type DbError } from '../../shared/errors.js';
import { MatchConfirmationReader } from '../matches.ports.js';

class FakeRepo {
  constructor(private readonly b: { count?: number; fails?: boolean } = {}) {}

  countConfirmedForLost(_id: string): ResultAsync<number, DbError> {
    if (this.b.fails) return errAsync(dbError('count'));
    return okAsync(this.b.count ?? 0);
  }
}

function reader(b: { count?: number; fails?: boolean } = {}) {
  return new MatchConfirmationReader(new FakeRepo(b) as unknown as never);
}

describe('MatchConfirmationReader', () => {
  it('returns true when a confirmed match exists (Ok)', async () => {
    const res = await reader({ count: 1 }).hasConfirmedMatchForLost('lost-1');
    expect(res.isOk() && res._unsafeUnwrap()).toBe(true);
  });

  it('returns false when no confirmed match exists (Ok)', async () => {
    const res = await reader({ count: 0 }).hasConfirmedMatchForLost('lost-1');
    expect(res.isOk() && res._unsafeUnwrap()).toBe(false);
  });

  it('surfaces DbError', async () => {
    const res = await reader({ fails: true }).hasConfirmedMatchForLost(
      'lost-1',
    );
    expect(res.isErr() && res.error.tag).toBe('DbError');
  });
});
