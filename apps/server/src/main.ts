import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { loadAppConfig } from './config/config.js';
import { DomainExceptionFilter } from './shared/http/domain-exception.filter.js';
import { logger } from './shared/logger/logger.js';

// Local dev/standalone: load apps/server/.env so `pnpm dev` works from a
// fresh clone (see docs/local-development.md). Node's loader does NOT
// override vars already in the environment, so CI and ./dev.sh (which
// exports the detected DATABASE_URL) still win. No-op if the file is
// absent (prod/CI inject real env). Tests never import main.ts.
function loadDotenv(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

async function bootstrap(): Promise<void> {
  loadDotenv();
  const cfg = loadAppConfig(process.env);
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  app.use(helmet());
  app.enableCors({ origin: cfg.corsAllowedOrigins });
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.listen(cfg.port);
  logger.info({ port: cfg.port }, 'server started');
}

void bootstrap();
