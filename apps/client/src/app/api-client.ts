import { createApiClient } from '@/modules/shared/http/api-client';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

// Auth token wiring lands in slice #4; the health probe is a @Public() route.
export const apiClient = createApiClient({
  baseUrl,
  getAccessToken: async () => 'anonymous',
});
