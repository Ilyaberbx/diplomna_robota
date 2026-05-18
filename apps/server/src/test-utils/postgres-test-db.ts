import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../db/schema.js';
import type { Database } from '../db/db.module.js';

export type TestDb = {
  db: Database;
  stop: () => Promise<void>;
};

export async function createPostgresTestDb(): Promise<TestDb> {
  const container: StartedPostgreSqlContainer =
    await new PostgreSqlContainer('postgres:16-alpine').start();
  const client = postgres(container.getConnectionUri());
  const db = drizzle(client, { schema });

  await db.execute(sql`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    )
  `);

  await db.execute(sql`
    create table if not exists reports (
      id uuid primary key default gen_random_uuid(),
      kind text not null,
      reporter_id uuid not null references users(id),
      status text not null,
      species text not null,
      breed text,
      name text,
      color text,
      description text,
      photo_key text,
      contact_phone text,
      contact_email text,
      lat double precision not null,
      lng double precision not null,
      event_date timestamptz not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await db.execute(sql`
    create table if not exists matches (
      id uuid primary key default gen_random_uuid(),
      lost_report_id uuid not null references reports(id),
      found_report_id uuid not null references reports(id),
      proposed_by uuid not null references users(id),
      status text not null,
      created_at timestamptz not null default now(),
      resolved_at timestamptz,
      constraint matches_lost_found_unique unique (lost_report_id, found_report_id)
    )
  `);

  return {
    db,
    stop: async () => {
      await client.end();
      await container.stop();
    },
  };
}
