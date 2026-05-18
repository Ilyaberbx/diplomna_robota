import { createContext } from 'react';
import type { ApiClient } from '@/modules/shared/http/http.types';

export const ApiClientContext = createContext<ApiClient | null>(null);
