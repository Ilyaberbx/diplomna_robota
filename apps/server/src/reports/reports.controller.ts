import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { err, type Result } from 'neverthrow';
import { errorToBody, errorToStatus } from '../shared/http/error-status.js';
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
import { unsupportedMediaType } from './reports.errors.js';
import type {
  Candidate,
  MultipartFile,
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

  @Get(':id/candidates')
  async candidates(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<Candidate[]> {
    return toHttp(await this.svc.getCandidates(actor.id, id));
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

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file: MultipartFile | undefined,
  ): Promise<OwnerReport> {
    const hasFile = file !== undefined;
    if (!hasFile)
      return toHttp(err(unsupportedMediaType('none')));
    return toHttp(
      await this.svc.attachPhoto(actor.id, id, {
        buffer: file.buffer,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      }),
    );
  }

  // Public: the report photo is rendered by anonymous browsers via a plain
  // <img src>, so the stream endpoint must not require a token.
  @Public()
  @Get(':id/photo')
  async getPhoto(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.svc.getPhoto(id);
    if (result.isErr()) {
      const err = result.error;
      res.status(errorToStatus(err)).json(errorToBody(err));
      return;
    }
    const blob = result.value;
    res.setHeader('content-type', blob.contentType);
    res.setHeader('cache-control', 'private, max-age=60');
    blob.stream.pipe(res);
  }
}
