import type { ResultAsync } from 'neverthrow';
import type { DbError, NotFound } from '../shared/errors.js';
import type { PublicUser } from './auth.types.js';

export const AUTH_READER = Symbol('AUTH_READER');

export interface AuthReader {
  me(actorId: string): ResultAsync<PublicUser, NotFound | DbError>;
}
