import { StatusCodes } from 'http-status-codes';
import type { HttpError } from '@/modules/shared/http/http.types';
import type { TKey } from '@/modules/shared/providers/i18n';

function apiErrorCode(body: unknown): string | null {
  const isObject = typeof body === 'object' && body !== null;
  if (!isObject) return null;
  const error = (body as { error?: unknown }).error;
  const isErrorObject = typeof error === 'object' && error !== null;
  if (!isErrorObject) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

/** Returns an i18n catalog key; the row resolves it through `t()`. */
export function rowErrorMessage(error: HttpError): TKey {
  const isApi = error.kind === 'api';
  if (!isApi) return 'rowError.generic';
  const isInvalidTransition =
    error.status === StatusCodes.CONFLICT &&
    apiErrorCode(error.body) === 'INVALID_TRANSITION';
  if (isInvalidTransition) return 'rowError.invalidTransition';
  const isForbidden = error.status === StatusCodes.FORBIDDEN;
  if (isForbidden) return 'rowError.forbidden';
  return 'rowError.generic';
}
