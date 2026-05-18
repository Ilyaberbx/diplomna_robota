import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { APP_CONFIG } from '../config/config.js';
import type { AppConfig } from '../config/config.js';
import * as schema from './schema.js';

export const DRIZZLE = Symbol('DRIZZLE');

export type Database = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig): Database => {
        const sql = postgres(cfg.databaseUrl);
        return drizzle(sql, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
