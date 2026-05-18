import type { ResultAsync } from 'neverthrow';
import type { DbError, NotFound } from '../shared/errors.js';
import type { StoredBlob } from './storage.types.js';

export const STORAGE_CLIENT = Symbol('STORAGE_CLIENT');

export interface StoragePort {
  put(
    body: Buffer,
    contentType: string,
  ): ResultAsync<string, DbError>;
  get(key: string): ResultAsync<StoredBlob, NotFound | DbError>;
}
