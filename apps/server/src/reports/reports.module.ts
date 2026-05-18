import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';
import { REPORTS_READER, REPORTS_WRITER } from './reports.ports.js';

@Module({
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
