import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { loadAppConfig } from './config/config.js';
import { DomainExceptionFilter } from './shared/http/domain-exception.filter.js';
import { logger } from './shared/logger/logger.js';

async function bootstrap(): Promise<void> {
  const cfg = loadAppConfig(process.env);
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  app.use(helmet());
  app.enableCors({ origin: cfg.corsAllowedOrigins });
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.listen(cfg.port);
  logger.info({ port: cfg.port }, 'server started');
}

void bootstrap();
