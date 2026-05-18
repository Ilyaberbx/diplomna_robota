import { createContext } from 'react';
import type { AuthSessionValue } from '../../auth.types.js';

export const AuthSessionContext = createContext<AuthSessionValue | null>(null);
