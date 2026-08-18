import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const refreshTokensTable = pgTable("refresh_tokens", {
	id: uuid().primaryKey().defaultRandom(),
	user_id: uuid()
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	token_hash: varchar().notNull().unique(),
	expires_at: timestamp().notNull(),
	revoked_at: timestamp(),
	created_at: timestamp().defaultNow().notNull(),
});
