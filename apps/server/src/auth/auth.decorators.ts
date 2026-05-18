import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './auth.types.js';

export const IS_PUBLIC_KEY = 'auth:isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRE_USER_KEY = 'auth:requireUser';
export const RequireUser = (): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_USER_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return (req as Request & { user: AuthenticatedUser }).user;
  },
);
