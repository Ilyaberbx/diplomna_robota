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

  return {
    db,
    stop: async () => {
      await client.end();
      await container.stop();
    },
  };
}
