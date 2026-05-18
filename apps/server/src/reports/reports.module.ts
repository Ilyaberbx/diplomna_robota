import { Module } from '@nestjs/common';
// Leaf module imported by file path, not the `../matches` barrel — see the
// note in reports.service.ts and ADR 0005 (avoids the reports↔matches cycle).
import { MatchesReaderModule } from '../matches/matches-reader.module.js';
import { StorageModule } from '../storage/index.js';
import { ReportsController } from './reports.controller.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';
import { REPORTS_READER, REPORTS_WRITER } from './reports.ports.js';

@Module({
  imports: [StorageModule, MatchesReaderModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsRepository,
    { provide: REPORTS_READER, useExisting: ReportsService },
    { provide: REPORTS_WRITER, useExisting: ReportsService },
  ],
  exports: [REPORTS_READER, REPORTS_WRITER],
})
export class ReportsModule {}
