import { createApiClient } from '@/modules/shared/http/api-client';
import { tokenStorage } from '@/modules/auth';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

// The shared HTTP client demands a token per request; public routes
// (health, register, login) tolerate the placeholder when none is stored.
export const apiClient = createApiClient({
  baseUrl,
  getAccessToken: async () => tokenStorage.get() ?? 'anonymous',
});
