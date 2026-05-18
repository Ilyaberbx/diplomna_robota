import { NestFactory } from '@nestjs/core';
import { beforeAll, describe, expect, it } from 'vitest';
// Imported exactly as main.ts imports it, so this test reproduces the real
// `main.ts → AppModule` ES-module evaluation order. A reports↔matches (or any
// other) import cycle that throws at decorator-evaluation time fails here —
// `pnpm verify`'s tsc/build/vitest-per-file steps never boot this graph and
// would stay green while the server is unrunnable. See
// docs/adr/0005-matches-reader-leaf-module-for-reunited-rule.md.
import { AppModule } from '../app.module.js';

describe('AppModule boot', () => {
  beforeAll(() => {
    // ConfigModule's APP_CONFIG factory runs loadAppConfig(process.env) at DI
    // time. The URL never connects — postgres-js is lazy and context creation
    // issues no query — so no live database is required.
    process.env.DATABASE_URL = 'postgres://u:p@localhost:5432/boot-smoke';
    process.env.AUTH_JWT_SECRET = 'test-secret';
  });

  it('instantiates the full module + DI graph without throwing', async () => {
    const context = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });
    await context.close();
    expect(context).toBeDefined();
  });
});
