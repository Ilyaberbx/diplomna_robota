import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AppConfig } from '../../config/config.js';
import { LocalFsStorageClient } from '../storage.adapter.js';

function collect(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c: Buffer) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

describe('LocalFsStorageClient (temp dir)', () => {
  let dir: string;
  let storage: LocalFsStorageClient;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    storage = new LocalFsStorageClient({ storageDir: dir } as AppConfig);
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('put then get round-trips the bytes and content type', async () => {
    const body = Buffer.from([0xff, 0xd8, 0xff, 0x01, 0x02]);
    const put = await storage.put(body, 'image/jpeg');
    expect(put.isOk()).toBe(true);
    const key = put._unsafeUnwrap();

    const got = await storage.get(key);
    expect(got.isOk()).toBe(true);
    const blob = got._unsafeUnwrap();
    expect(blob.contentType).toBe('image/jpeg');
    expect(await collect(blob.stream)).toEqual(body);
  });

  it('get for an unknown key returns NotFound', async () => {
    const got = await storage.get('00000000-0000-0000-0000-000000000000');
    expect(got.isErr()).toBe(true);
    if (got.isErr()) expect(got.error.tag).toBe('NotFound');
  });
});
