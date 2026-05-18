import type { Readable } from 'node:stream';

export type StoredBlob = {
  stream: Readable;
  contentType: string;
};
