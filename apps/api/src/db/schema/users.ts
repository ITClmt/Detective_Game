import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	username: varchar().notNull(),
	email: varchar().notNull().unique(),
	password: varchar().notNull(),
	role: varchar({ enum: ["admin", "player"] })
		.notNull()
		.default("player"),
	updated_at: timestamp(),
	created_at: timestamp().defaultNow().notNull(),
	deleted_at: timestamp(),
});
