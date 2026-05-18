import { Inject, Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { APP_CONFIG, type AppConfig } from '../config/config.js';
import { dbError, type DbError } from '../shared/errors.js';
import { AuthRepository } from './auth.repository.js';
import {
  emailTaken,
  invalidCredentials,
  notFound,
  type EmailTaken,
  type InvalidCredentials,
  type NotFound,
} from './auth.errors.js';
import type { Credentials } from './auth.dto.js';
import type {
  AuthResult,
  JwtPayload,
  PublicUser,
  UserRecord,
} from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  register(
    input: Credentials,
  ): ResultAsync<AuthResult, EmailTaken | DbError> {
    return this.repo.findByEmail(input.email).andThen((existing) => {
      const isEmailTaken = existing !== null;
      if (isEmailTaken) return errAsync(emailTaken(input.email));
      return this.hash(input.password)
        .andThen((passwordHash) =>
          this.repo.insert({ email: input.email, passwordHash }),
        )
        .map((user) => this.toAuthResult(user));
    });
  }

  login(
    input: Credentials,
  ): ResultAsync<AuthResult, InvalidCredentials | DbError> {
    return this.repo.findByEmail(input.email).andThen((user) => {
      const isUnknownEmail = user === null;
      if (isUnknownEmail) return errAsync(invalidCredentials());
      return this.verifyPassword(user.passwordHash, input.password).andThen(
        (isValid) => {
          if (!isValid) return errAsync(invalidCredentials());
          return okAsync(this.toAuthResult(user));
        },
      );
    });
  }

  me(actorId: string): ResultAsync<PublicUser, NotFound | DbError> {
    return this.repo.findById(actorId).andThen((user) => {
      const isMissing = user === null;
      if (isMissing) return errAsync(notFound('user', actorId));
      return okAsync(this.toPublicUser(user));
    });
  }

  private hash(password: string): ResultAsync<string, DbError> {
    return ResultAsync.fromPromise(
      argon2.hash(password, { type: argon2.argon2id }),
      (cause) => dbError(cause),
    );
  }

  private verifyPassword(
    hash: string,
    password: string,
  ): ResultAsync<boolean, DbError> {
    return ResultAsync.fromPromise(argon2.verify(hash, password), (cause) =>
      dbError(cause),
    );
  }

  private toPublicUser(user: UserRecord): PublicUser {
    return { id: user.id, email: user.email };
  }

  private toAuthResult(user: UserRecord): AuthResult {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const token = jwt.sign(payload, this.cfg.authJwtSecret, {
      expiresIn: this.cfg.authJwtTtl as jwt.SignOptions['expiresIn'],
    });
    return { token, user: this.toPublicUser(user) };
  }
}
