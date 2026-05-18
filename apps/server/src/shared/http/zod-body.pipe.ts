import { Body, Injectable, Query, type PipeTransform } from '@nestjs/common';
import { err, ok, type Result } from 'neverthrow';
import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { parseError, type ParseError } from '../errors.js';

@Injectable()
export class ZodBodyPipe<S extends ZodTypeAny>
  implements PipeTransform<unknown, Result<ZodInfer<S>, ParseError>>
{
  constructor(private readonly schema: S) {}

  transform(value: unknown): Result<ZodInfer<S>, ParseError> {
    const parsed = this.schema.safeParse(value);
    if (parsed.success) return ok(parsed.data);

    const issues: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      issues[path] = issue.message;
    }
    return err(parseError(issues));
  }
}

export const ZodBody = <S extends ZodTypeAny>(
  schema: S,
): ParameterDecorator => Body(new ZodBodyPipe(schema));

export const ZodQuery = <S extends ZodTypeAny>(
  schema: S,
): ParameterDecorator => Query(new ZodBodyPipe(schema));
