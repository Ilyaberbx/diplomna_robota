import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/index.js';
import { ConfigModule } from './config/config.module.js';
import { DbModule } from './db/db.module.js';
import { HealthModule } from './health/index.js';
import { ReportsModule } from './reports/index.js';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    ReportsModule,
    HealthModule,
  ],
})
export class AppModule {}
