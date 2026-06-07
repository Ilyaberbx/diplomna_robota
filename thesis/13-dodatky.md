ДОДАТОК А
Лістинги програмного коду

Лістинг А.1 – Програмна реалізація схеми бази даних

```ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull().defaultNow(),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id),
  status: text('status').notNull(),
  species: text('species').notNull(),
  breed: text('breed'),
  name: text('name'),
  color: text('color'),
  description: text('description'),
  photoKey: text('photo_key'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull().defaultNow(),
});

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  lostReportId: uuid('lost_report_id').notNull().references(() => reports.id),
  foundReportId: uuid('found_report_id').notNull().references(() => reports.id),
  proposedBy: uuid('proposed_by').notNull().references(() => users.id),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (t) => ({
  lostFoundUnique: unique('matches_lost_found_unique')
    .on(t.lostReportId, t.foundReportId),
}));
```

Лістинг А.2 – Програмна реалізація сервісу зіставлення оголошень

```ts
findCandidates(subject: ReportRecord): ResultAsync<CandidateRecord[], DbError> {
  const oppositeKind = subject.kind === 'lost' ? 'found' : 'lost';
  const distanceKm = this.haversineKm(subject.lat, subject.lng);
  const speciesMatch = sql<boolean>`${reports.species} = ${subject.species}`;
  const subjectDateIso = subject.eventDate.toISOString();
  const daysApart = sql<number>`abs(extract(epoch from
    (${reports.eventDate} - ${subjectDateIso}::timestamptz)) / 86400)`;

  const query = this.db
    .select({ row: reports, distanceKm, speciesMatch, daysApart })
    .from(reports)
    .where(and(eq(reports.kind, oppositeKind), ne(reports.id, subject.id)))
    .orderBy(desc(speciesMatch), distanceKm, daysApart);

  return ResultAsync.fromPromise(query, (cause) => dbError(cause)).map(
    (rows) =>
      rows.map((r) => ({
        report: toRecord(r.row),
        distanceKm: Number(r.distanceKm),
        speciesMatch: r.speciesMatch,
      })),
  );
}
```

Лістинг А.3 – Програмна реалізація обчислення відстані

```ts
const EARTH_RADIUS_KM = 6371;

private haversineKm(lat: number, lng: number): SQL<number> {
  return sql<number>`${EARTH_RADIUS_KM} * acos(
    least(1, greatest(-1,
      cos(radians(${lat})) * cos(radians(${reports.lat}))
        * cos(radians(${reports.lng}) - radians(${lng}))
      + sin(radians(${lat})) * sin(radians(${reports.lat}))
    ))
  )`;
}
```

Лістинг А.4 – Програмна реалізація сервісу підтвердження зв'язку

```ts
confirm(actorId: string, matchId: string) {
  return this.decide(actorId, matchId, 'confirmed')
    .andThen((record) => this.reveal(record));
}

private decide(actorId: string, matchId: string,
               status: 'confirmed' | 'rejected') {
  return this.repo.findById(matchId).andThen((match) => {
    if (match === null) return errAsync(notFound('match', matchId));
    const isStillPending = match.status === 'proposed';
    if (!isStillPending)
      return errAsync(
        conflict('only a proposed match can be confirmed or rejected'));
    return this.authorizeDecider(actorId, match)
      .andThen(() => this.repo.resolve(match.id, status));
  });
}

private authorizeDecider(actorId: string, match: MatchRecord) {
  return ResultAsync.combine([
    this.reports.getRecord(match.lostReportId),
    this.reports.getRecord(match.foundReportId),
  ]).andThen(([lost, found]) => {
    const proposerOwnsLostSide = lost.reporterId === match.proposedBy;
    const decidingReporterId = proposerOwnsLostSide
      ? found.reporterId : lost.reporterId;
    const isNonProposingReporter = actorId === decidingReporterId;
    if (!isNonProposingReporter)
      return errAsync(
        forbidden('only the non-proposing reporter may decide this match'));
    return okAsync<true>(true);
  });
}

private reveal(record: MatchRecord) {
  return ResultAsync.combine([
    this.reports.revealContact(record.lostReportId),
    this.reports.revealContact(record.foundReportId),
  ]).map(([lostReport, foundReport]) => ({
    ...toView(record), lostReport, foundReport,
  }));
}
```

<!-- ОФОРМЛЕННЯ:
- Односторінкові додатки об'єднано в один Додаток А «Лістинги програмного коду» (зауваж. малої комісії 2026-06-06 №14).
- «ДОДАТОК А» — з нової сторінки, ВЕЛИКИМИ, напівжирний, по центру, без крапки; назва додатка з нового рядка, малими з першої великої, по центру, без абзацного відступу, без крапки.
- Літера додатка А — дозволена (заборонені: Ґ, Є, З, І, Ї, Й, О, Ч, Щ, Ь).
- Лістинги А.1–А.4: заголовок «Лістинг А.N – …» з абзацного відступу, один порожній рядок перед ним; роздільна лінія 0,25 пт до тіла і після; Courier New 10 пт, одинарний інтервал, ліве вирівнювання, без абзацних відступів, кольорове підсвічування синтаксису.
- На кожен лістинг А.1–А.4 є посилання в тексті розділу 4 (програмна реалізація) до його появи.
- Код наведено за фактичною реалізацією у репозиторії (apps/server/src/db/schema.ts, reports/reports.repository.ts, matches/matches.service.ts).
- Наскрізна нумерація сторінок охоплює додаток.
-->
