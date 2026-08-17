import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token_hash: varchar().notNull().unique(),
  expires_at: timestamp().notNull(),
  revoked_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
});
