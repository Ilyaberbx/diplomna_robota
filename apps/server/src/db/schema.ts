// Drizzle schema. Tables are added by the module that owns them.
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
