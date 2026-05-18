import { Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { Result } from 'neverthrow';
import { okAsync } from 'neverthrow';
import { toHttp } from '../shared/http/to-http.js';
import { ZodBody, ZodQuery } from '../shared/http/zod-body.pipe.js';
import { CurrentUser, OptionalUser, Public } from '../auth/index.js';
import type { AuthenticatedUser } from '../auth/index.js';
import type { ParseError } from '../shared/errors.js';
import {
  browseQuerySchema,
  createReportSchema,
  updateReportSchema,
  type BrowseQueryInput,
  type CreateReportInput,
  type UpdateReportInput,
} from './reports.dto.js';
import { ReportsService } from './reports.service.js';
import type {
  OwnerReport,
  ReportPage,
  ReportProjection,
} from './reports.types.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Post()
  async create(
    @CurrentUser() actor: AuthenticatedUser,
    @ZodBody(createReportSchema) input: Result<CreateReportInput, ParseError>,
  ): Promise<OwnerReport> {
    return toHttp(
      await input.asyncAndThen((i) => this.svc.create(actor.id, i)),
    );
  }

  // Public: browsing active reports requires no account (anonymous
  // reassurance flow). Contact fields are stripped by the public projection.
  @Public()
  @Get()
  async browse(
    @ZodQuery(browseQuerySchema) query: Result<BrowseQueryInput, ParseError>,
  ): Promise<ReportPage> {
    return toHttp(
      await query.asyncAndThen((q) => this.svc.browse(q)),
    );
  }

  // Public: a report is viewable without an account; the projection switches
  // to the owner shape only when the bearer token matches the reporter.
  @Public()
  @OptionalUser()
  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ReportProjection> {
    const actor = (req as Request & { user?: AuthenticatedUser }).user ?? null;
    const actorId = actor ? actor.id : null;
    return toHttp(await this.svc.getOne(actorId, id));
  }

  @Patch(':id')
  async update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @ZodBody(updateReportSchema) input: Result<UpdateReportInput, ParseError>,
  ): Promise<OwnerReport> {
    return toHttp(
      await input.asyncAndThen((i) => this.svc.update(actor.id, id, i)),
    );
  }
}
