import { errAsync, ResultAsync } from 'neverthrow';
import { StatusCodes } from 'http-status-codes';
import { notifySessionExpired } from './session-expired.js';
import type {
  ApiClient,
  CreateApiClientOptions,
  HttpError,
} from './http.types.js';

type RequestSpec = {
  method: 'GET' | 'POST';
  url: string;
  body?: unknown;
  formData?: FormData;
};

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

export function createApiClient(opts: CreateApiClientOptions): ApiClient {
  const send = (
    spec: RequestSpec,
    token: string,
  ): ResultAsync<Response, HttpError> => {
    // Each send issues its own fetch, so a retry never shares the original
    // request (http.md §3). The frozen public surface exposes no cancellation;
    // a per-send AbortController is added the day cancellation is wired in.
    const isMultipart = spec.formData !== undefined;
    // The browser must set the multipart boundary itself, so content-type is
    // omitted for uploads (ADR 0004).
    const headers: Record<string, string> = isMultipart
      ? { authorization: `Bearer ${token}` }
      : {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        };
    const jsonBody =
      spec.body === undefined ? undefined : JSON.stringify(spec.body);
    const init: RequestInit = {
      method: spec.method,
      headers,
      body: isMultipart ? spec.formData : jsonBody,
    };
    return ResultAsync.fromPromise(
      fetch(`${opts.baseUrl}${spec.url}`, init),
      (cause): HttpError => ({ kind: 'network', cause }),
    );
  };

  const parse = <T>(res: Response): ResultAsync<T, HttpError> =>
    ResultAsync.fromPromise(
      res.json() as Promise<T>,
      (cause): HttpError => ({ kind: 'parse', cause }),
    );

  const toApiError = (res: Response): ResultAsync<never, HttpError> =>
    ResultAsync.fromPromise(
      res
        .clone()
        .json()
        .catch(() => res.text()),
      (cause): HttpError => ({ kind: 'parse', cause }),
    ).andThen((body) =>
      errAsync<never, HttpError>({
        kind: 'api',
        status: res.status,
        body,
      }),
    );

  const run = <T>(spec: RequestSpec): ResultAsync<T, HttpError> =>
    ResultAsync.fromPromise(
      opts.getAccessToken(),
      (cause): HttpError => ({ kind: 'network', cause }),
    ).andThen((token) => {
      const isMissingToken = token === null;
      if (isMissingToken) {
        return errAsync<T, HttpError>({
          kind: 'network',
          cause: new Error('missing access token'),
        });
      }
      return send(spec, token).andThen((res) => attempt<T>(spec, res, false));
    });

  const attempt = <T>(
    spec: RequestSpec,
    res: Response,
    isRetry: boolean,
  ): ResultAsync<T, HttpError> => {
    const isUnauthorized = res.status === StatusCodes.UNAUTHORIZED;
    const isFinalUnauthorized = isUnauthorized && isRetry;
    if (isFinalUnauthorized) {
      notifySessionExpired();
      return errAsync<T, HttpError>({ kind: 'session-expired' });
    }
    if (isUnauthorized) {
      return ResultAsync.fromPromise(
        opts.getAccessToken(),
        (cause): HttpError => ({ kind: 'network', cause }),
      ).andThen((token) => {
        const isMissingToken = token === null;
        if (isMissingToken) {
          notifySessionExpired();
          return errAsync<T, HttpError>({ kind: 'session-expired' });
        }
        return send(spec, token).andThen((retryRes) =>
          attempt<T>(spec, retryRes, true),
        );
      });
    }
    const isApiFailure = !isSuccess(res.status);
    if (isApiFailure) return toApiError(res);
    return parse<T>(res);
  };

  return {
    get: <T>(url: string) => run<T>({ method: 'GET', url }),
    post: <T>(url: string, body: unknown) =>
      run<T>({ method: 'POST', url, body }),
    upload: <T>(url: string, file: Blob, fileName: string) => {
      const formData = new FormData();
      formData.append('photo', file, fileName);
      return run<T>({ method: 'POST', url, formData });
    },
  };
}
