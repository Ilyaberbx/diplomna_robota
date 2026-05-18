import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { ResultAsync, okAsync } from 'neverthrow';
import { APP_CONFIG, type AppConfig } from '../config/config.js';
import {
  dbError,
  notFound,
  type DbError,
  type NotFound,
} from '../shared/errors.js';
import type { StoragePort } from './storage.ports.js';
import type { StoredBlob } from './storage.types.js';

@Injectable()
export class LocalFsStorageClient implements StoragePort {
  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}

  put(body: Buffer, contentType: string): ResultAsync<string, DbError> {
    const key = randomUUID();
    const dir = this.cfg.storageDir;
    const write = mkdir(dir, { recursive: true })
      .then(() => writeFile(join(dir, key), body))
      .then(() => writeFile(join(dir, `${key}.type`), contentType));
    return ResultAsync.fromPromise(write, (cause) => dbError(cause)).map(
      () => key,
    );
  }

  get(key: string): ResultAsync<StoredBlob, NotFound | DbError> {
    const dir = this.cfg.storageDir;
    return ResultAsync.fromPromise(
      readFile(join(dir, `${key}.type`), 'utf8'),
      (cause): NotFound | DbError => {
        const isMissing =
          typeof cause === 'object' &&
          cause !== null &&
          (cause as { code?: string }).code === 'ENOENT';
        return isMissing ? notFound('photo', key) : dbError(cause);
      },
    ).andThen((contentType) => {
      const stream = createReadStream(join(dir, key));
      return okAsync<StoredBlob, NotFound | DbError>({
        stream,
        contentType: contentType.trim(),
      });
    });
  }
}
