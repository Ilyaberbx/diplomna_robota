import { assertNever } from '../errors.js';
import type {
  Conflict,
  DbError,
  Forbidden,
  NotFound,
  ParseError,
  Unauthorized,
} from '../errors.js';

export type AppError =
  | NotFound
  | Forbidden
  | Conflict
  | Unauthorized
  | DbError
  | ParseError;

export type HttpErrorBody = {
  error: {
    code: string;
    message: string;
    issues?: Record<string, string>;
  };
};

export function errorToStatus(err: AppError): number {
  switch (err.tag) {
    case 'NotFound':
      return 404;
    case 'Forbidden':
      return 403;
    case 'Conflict':
      return 409;
    case 'Unauthorized':
      return 401;
    case 'ParseError':
      return 400;
    case 'DbError':
      return 500;
    default:
      return assertNever(err);
  }
}

export function errorToBody(err: AppError): HttpErrorBody {
  switch (err.tag) {
    case 'NotFound':
      return { error: { code: 'NOT_FOUND', message: `${err.resource} not found` } };
    case 'Forbidden':
      return { error: { code: 'FORBIDDEN', message: 'Forbidden' } };
    case 'Conflict':
      return { error: { code: 'CONFLICT', message: err.reason } };
    case 'Unauthorized':
      return { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } };
    case 'ParseError':
      return {
        error: {
          code: 'VALIDATION',
          message: 'Validation failed',
          issues: err.issues,
        },
      };
    case 'DbError':
      return { error: { code: 'INTERNAL', message: 'Internal server error' } };
    default:
      return assertNever(err);
  }
}
