import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/index.js';
import { MatchesController } from './matches.controller.js';
import { MatchesRepository } from './matches.repository.js';
import { MatchesService } from './matches.service.js';

@Module({
  imports: [ReportsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchesRepository],
})
export class MatchesModule {}
