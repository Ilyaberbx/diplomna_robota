import { Controller, Get, Post } from '@nestjs/common';
import type { Result } from 'neverthrow';
import { toHttp } from '../shared/http/to-http.js';
import { ZodBody } from '../shared/http/zod-body.pipe.js';
import { CurrentUser, Public } from './auth.decorators.js';
import { credentialsSchema, type Credentials } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedUser, AuthResult, PublicUser } from './auth.types.js';
import type { ParseError } from '../shared/errors.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  // Public: a user cannot have a token before registering (ADR 0003).
  @Public()
  @Post('register')
  async register(
    @ZodBody(credentialsSchema) input: Result<Credentials, ParseError>,
  ): Promise<AuthResult> {
    return toHttp(await input.asyncAndThen((i) => this.svc.register(i)));
  }

  // Public: login issues the first token; no identity exists yet (ADR 0003).
  @Public()
  @Post('login')
  async login(
    @ZodBody(credentialsSchema) input: Result<Credentials, ParseError>,
  ): Promise<AuthResult> {
    return toHttp(await input.asyncAndThen((i) => this.svc.login(i)));
  }

  @Get('me')
  async me(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublicUser> {
    return toHttp(await this.svc.me(actor.id));
  }
}
