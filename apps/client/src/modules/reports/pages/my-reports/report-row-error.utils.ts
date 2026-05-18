import { StatusCodes } from 'http-status-codes';
import type { HttpError } from '@/modules/shared/http/http.types';

function apiErrorCode(body: unknown): string | null {
  const isObject = typeof body === 'object' && body !== null;
  if (!isObject) return null;
  const error = (body as { error?: unknown }).error;
  const isErrorObject = typeof error === 'object' && error !== null;
  if (!isErrorObject) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export function rowErrorMessage(error: HttpError): string {
  const isApi = error.kind === 'api';
  if (!isApi) return 'Something went wrong. Please try again.';
  const isInvalidTransition =
    error.status === StatusCodes.CONFLICT &&
    apiErrorCode(error.body) === 'INVALID_TRANSITION';
  if (isInvalidTransition)
    return 'This change is not allowed yet — marking reunited needs a confirmed match.';
  const isForbidden = error.status === StatusCodes.FORBIDDEN;
  if (isForbidden) return 'Only the reporter can change this report.';
  return 'Something went wrong. Please try again.';
}
