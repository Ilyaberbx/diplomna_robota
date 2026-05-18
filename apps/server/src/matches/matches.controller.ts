import { Controller, Get, Param, Post } from '@nestjs/common';
import type { Result } from 'neverthrow';
import { toHttp } from '../shared/http/to-http.js';
import { ZodBody, ZodQuery } from '../shared/http/zod-body.pipe.js';
import { CurrentUser } from '../auth/index.js';
import type { AuthenticatedUser } from '../auth/index.js';
import type { ParseError } from '../shared/errors.js';
import {
  listMatchesQuerySchema,
  proposeMatchSchema,
  type ListMatchesQueryInput,
  type ProposeMatchInput,
} from './matches.dto.js';
import { MatchesService } from './matches.service.js';
import type {
  MatchView,
  RevealedMatchView,
} from './matches.types.js';

@Controller('matches')
export class MatchesController {
  constructor(private readonly svc: MatchesService) {}

  @Post()
  async propose(
    @CurrentUser() actor: AuthenticatedUser,
    @ZodBody(proposeMatchSchema) input: Result<ProposeMatchInput, ParseError>,
  ): Promise<MatchView> {
    return toHttp(
      await input.asyncAndThen((i) =>
        this.svc.propose(actor.id, i.lostReportId, i.foundReportId),
      ),
    );
  }

  @Get()
  async list(
    @ZodQuery(listMatchesQuerySchema)
    query: Result<ListMatchesQueryInput, ParseError>,
  ): Promise<MatchView[]> {
    return toHttp(
      await query.asyncAndThen((q) => this.svc.listForReport(q.reportId)),
    );
  }

  @Post(':id/confirm')
  async confirm(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<RevealedMatchView> {
    return toHttp(await this.svc.confirm(actor.id, id));
  }

  @Post(':id/reject')
  async reject(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<MatchView> {
    return toHttp(await this.svc.reject(actor.id, id));
  }
}
