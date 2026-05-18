import type { ReactNode } from 'react';
import type { ApiClient } from '@/modules/shared/http/http.types';
import { ApiClientContext } from './api-client.context.js';

export function ApiClientProvider({
  client,
  children,
}: {
  client: ApiClient;
  children: ReactNode;
}) {
  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}
