import { useContext } from 'react';
import type { ApiClient } from '@/modules/shared/http/http.types';
import { ApiClientContext } from './api-client.context.js';

export function useApiClient(): ApiClient {
  const ctx = useContext(ApiClientContext);
  if (!ctx)
    throw new Error('useApiClient must be used within ApiClientProvider');
  return ctx;
}
