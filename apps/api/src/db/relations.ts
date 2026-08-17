import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	usersTable: {
		refreshTokens: r.many.refreshTokensTable({
			from: r.usersTable.id,
			to: r.refreshTokensTable.user_id,
		}),
	},
	refreshTokensTable: {
		user: r.one.usersTable({
			from: r.refreshTokensTable.user_id,
			to: r.usersTable.id,
		}),
	},
}));
