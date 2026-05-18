import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ResultAsync } from 'neverthrow';
import { DRIZZLE, type Database } from '../db/db.module.js';
import { users } from '../db/schema.js';
import { dbError, type DbError } from '../shared/errors.js';
import type { UserRecord } from './auth.types.js';

export type CreateUserInput = {
  email: string;
  passwordHash: string;
};

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByEmail(email: string): ResultAsync<UserRecord | null, DbError> {
    return ResultAsync.fromPromise(
      this.db.select().from(users).where(eq(users.email, email)).limit(1),
      (cause) => dbError(cause),
    ).map((rows) => rows[0] ?? null);
  }

  findById(id: string): ResultAsync<UserRecord | null, DbError> {
    return ResultAsync.fromPromise(
      this.db.select().from(users).where(eq(users.id, id)).limit(1),
      (cause) => dbError(cause),
    ).map((rows) => rows[0] ?? null);
  }

  insert(input: CreateUserInput): ResultAsync<UserRecord, DbError> {
    return ResultAsync.fromPromise(
      this.db.insert(users).values(input).returning(),
      (cause) => dbError(cause),
    ).map((rows) => rows[0]);
  }
}
