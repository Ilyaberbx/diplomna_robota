import { Module } from '@nestjs/common';
import { MatchesRepository } from './matches.repository.js';
import { MATCHES_READER, MatchConfirmationReader } from './matches.ports.js';

// Leaf module: owns the `matches` repository and the cross-module
// `MATCHES_READER` port. It depends on nothing but the global `DbModule`, so
// `ReportsModule` can import it for the reunited-requires-confirmed-Match
// rule without forming a cycle with the reports-importing `MatchesModule`
// (backend-architecture rule 6: no circular DI). `MatchesModule` imports this
// module to reuse the single `MatchesRepository`.
@Module({
  providers: [
    MatchesRepository,
    { provide: MATCHES_READER, useClass: MatchConfirmationReader },
  ],
  exports: [MatchesRepository, MATCHES_READER],
})
export class MatchesReaderModule {}
