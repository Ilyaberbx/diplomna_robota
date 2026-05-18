import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import type { HttpErrorBody } from './error-status.js';

const STATUS_CODE: Record<number, string> = {
  400: 'VALIDATION',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

const INTERNAL_BODY: HttpErrorBody = {
  error: { code: 'INTERNAL', message: 'Internal server error' },
};

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    if (!isHttpException) {
      res.status(500).json(INTERNAL_BODY);
      return;
    }
    const status = exception.getStatus();
    res.status(status).json(this.bodyFor(status, exception.getResponse()));
  }

  private bodyFor(status: number, raw: unknown): HttpErrorBody {
    const isOurShape =
      typeof raw === 'object' &&
      raw !== null &&
      'error' in raw &&
      typeof (raw as { error: unknown }).error === 'object';
    if (isOurShape) return raw as HttpErrorBody;

    const code = STATUS_CODE[status] ?? 'INTERNAL';
    const isClientError = status >= 400 && status < 500;
    const message = isClientError ? code : 'Internal server error';
    return { error: { code, message } };
  }
}
