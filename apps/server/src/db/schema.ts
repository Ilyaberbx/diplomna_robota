// Drizzle schema. Tables are added by the module that owns them.
import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// Owned by the `auth` module. `users.id` is the canonical user identifier
// (ADR 0003); every user FK references it.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Owned by the `reports` module. SINGLE Lost+Found table discriminated by
// `kind` — the later Candidate query reads both kinds in one query and a
// repository may only touch its own module's tables. `status` and `species`
// are stored as text and validated by Zod enums at the boundary (no PG enum
// types). `contactPhone`/`contactEmail` are never selected into the public
// projection (privacy is a service-layer projection rule).
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull(),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id),
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
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Owned by the `matches` module. A Match is a stored, human-proposed link
// between exactly one Lost Report and one Found Report
// (`status`: proposed | confirmed | rejected). Only a human turns a Candidate
// into a Match. `proposed_by` is the proposing Reporter; only the
// *non-proposing* Reporter may confirm/reject. `unique(lost, found)` enforces
// one Match per (lost, found) pair. `status` is stored as text, validated by
// a Zod enum at the boundary (no PG enum types). Contact reveal on `confirmed`
// is a service-layer projection through the `reports` ReportsReader port —
// this module never touches the `reports` table.
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lostReportId: uuid('lost_report_id')
      .notNull()
      .references(() => reports.id),
    foundReportId: uuid('found_report_id')
      .notNull()
      .references(() => reports.id),
    proposedBy: uuid('proposed_by')
      .notNull()
      .references(() => users.id),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => [unique('matches_lost_found_unique').on(t.lostReportId, t.foundReportId)],
);
