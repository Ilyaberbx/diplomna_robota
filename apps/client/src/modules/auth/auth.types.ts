import type { ResultAsync } from 'neverthrow';
import type { HttpError } from '@/modules/shared/http/http.types';

export type PublicUser = {
  id: string;
  email: string;
};

export type AuthResult = {
  token: string;
  user: PublicUser;
};

export type Credentials = {
  email: string;
  password: string;
};

export type AuthSession =
  | { phase: 'loading' }
  | { phase: 'anonymous' }
  | { phase: 'authenticated'; user: PublicUser };

export type AuthSessionValue = {
  session: AuthSession;
  login: (input: Credentials) => ResultAsync<PublicUser, HttpError>;
  register: (input: Credentials) => ResultAsync<PublicUser, HttpError>;
  logout: () => void;
};
