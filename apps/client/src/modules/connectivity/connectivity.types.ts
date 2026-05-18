import type { HttpError } from '@/modules/shared/http/http.types';

export type HealthStatus = { status: 'ok' };

export type ConnectivityState =
  | { phase: 'loading' }
  | { phase: 'ok' }
  | { phase: 'error'; error: HttpError };
