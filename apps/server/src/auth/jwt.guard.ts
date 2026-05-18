import {
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { APP_CONFIG } from '../config/config.js';
import type { AppConfig } from '../config/config.js';
import { IS_PUBLIC_KEY } from './auth.decorators.js';
import type { AuthenticatedUser, JwtPayload } from './auth.types.js';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    const hasBearer =
      typeof header === 'string' && header.startsWith(BEARER_PREFIX);
    if (!hasBearer) throw new UnauthorizedException('Missing bearer token');

    const token = header.slice(BEARER_PREFIX.length);
    const user = this.verify(token);
    if (!user) throw new UnauthorizedException('Invalid token');

    (req as Request & { user: AuthenticatedUser }).user = user;
    return true;
  }

  private verify(token: string): AuthenticatedUser | null {
    try {
      const payload = jwt.verify(token, this.cfg.authJwtSecret) as JwtPayload;
      return { id: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }
}
