import { Controller, Get } from '@nestjs/common';
import { ok } from 'neverthrow';
import { Public } from '../auth/index.js';
import { toHttp } from '../shared/http/to-http.js';

@Controller('health')
export class HealthController {
  // Public: liveness probe, no identity required (ADR 0003).
  @Public()
  @Get()
  check(): { status: 'ok' } {
    return toHttp(ok({ status: 'ok' as const }));
  }
}
