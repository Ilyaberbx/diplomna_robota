export type SessionExpiredError = { kind: 'session-expired' };
export type ApiError = { kind: 'api'; status: number; body: unknown };
export type NetworkError = { kind: 'network'; cause: unknown };
export type ParseError = { kind: 'parse'; cause: unknown };

export type HttpError =
  | SessionExpiredError
  | ApiError
  | NetworkError
  | ParseError;

export type ApiClient = {
  get: <T>(url: string) => import('neverthrow').ResultAsync<T, HttpError>;
  post: <T>(
    url: string,
    body: unknown,
  ) => import('neverthrow').ResultAsync<T, HttpError>;
};

export type CreateApiClientOptions = {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
};
