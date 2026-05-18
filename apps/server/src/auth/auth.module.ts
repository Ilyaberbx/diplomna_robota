import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { AUTH_READER } from './auth.ports.js';
import { JwtAuthGuard } from './jwt.guard.js';

@Module({
  controllers: [AuthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    AuthService,
    AuthRepository,
    { provide: AUTH_READER, useExisting: AuthService },
  ],
  exports: [AUTH_READER],
})
export class AuthModule {}
