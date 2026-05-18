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
  // Multipart upload of a single binary file (ADR 0004). Same token attach,
  // missing-token guard, 401-retry and HttpError union as get/post.
  upload: <T>(
    url: string,
    file: Blob,
    fileName: string,
  ) => import('neverthrow').ResultAsync<T, HttpError>;
};

export type CreateApiClientOptions = {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
};
