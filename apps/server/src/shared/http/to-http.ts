import { HttpException } from '@nestjs/common';
import type { Result } from 'neverthrow';
import type { AppError } from './error-status.js';
import { errorToBody, errorToStatus } from './error-status.js';

export function toHttp<T>(result: Result<T, AppError>): T {
  if (result.isOk()) return result.value;
  const err = result.error;
  throw new HttpException(errorToBody(err), errorToStatus(err));
}
