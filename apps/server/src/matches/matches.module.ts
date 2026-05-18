import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/index.js';
import { MatchesController } from './matches.controller.js';
import { MatchesReaderModule } from './matches-reader.module.js';
import { MatchesService } from './matches.service.js';

@Module({
  imports: [ReportsModule, MatchesReaderModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
