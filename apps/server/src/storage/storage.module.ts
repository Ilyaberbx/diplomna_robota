import { Module } from '@nestjs/common';
import { LocalFsStorageClient } from './storage.adapter.js';
import { STORAGE_CLIENT } from './storage.ports.js';

@Module({
  providers: [{ provide: STORAGE_CLIENT, useClass: LocalFsStorageClient }],
  exports: [STORAGE_CLIENT],
})
export class StorageModule {}
