export type NotFound = { tag: 'NotFound'; resource: string; id: string };
export const notFound = (resource: string, id: string): NotFound => ({
  tag: 'NotFound',
  resource,
  id,
});

export type Forbidden = { tag: 'Forbidden'; reason: string };
export const forbidden = (reason: string): Forbidden => ({
  tag: 'Forbidden',
  reason,
});

export type Conflict = { tag: 'Conflict'; reason: string };
export const conflict = (reason: string): Conflict => ({
  tag: 'Conflict',
  reason,
});

export type Unauthorized = { tag: 'Unauthorized'; reason: string };
export const unauthorized = (reason: string): Unauthorized => ({
  tag: 'Unauthorized',
  reason,
});

export type DbError = { tag: 'DbError'; cause: unknown };
export const dbError = (cause: unknown): DbError => ({ tag: 'DbError', cause });

export type ParseError = {
  tag: 'ParseError';
  issues: Record<string, string>;
};
export const parseError = (issues: Record<string, string>): ParseError => ({
  tag: 'ParseError',
  issues,
});

export type EmailTaken = { tag: 'EmailTaken'; email: string };
export const emailTaken = (email: string): EmailTaken => ({
  tag: 'EmailTaken',
  email,
});

export type InvalidCredentials = { tag: 'InvalidCredentials' };
export const invalidCredentials = (): InvalidCredentials => ({
  tag: 'InvalidCredentials',
});

export type UnsupportedMediaType = {
  tag: 'UnsupportedMediaType';
  received: string;
};
export const unsupportedMediaType = (
  received: string,
): UnsupportedMediaType => ({ tag: 'UnsupportedMediaType', received });

export type PayloadTooLarge = {
  tag: 'PayloadTooLarge';
  maxBytes: number;
};
export const payloadTooLarge = (maxBytes: number): PayloadTooLarge => ({
  tag: 'PayloadTooLarge',
  maxBytes,
});

export function assertNever(x: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(x)}`);
}
