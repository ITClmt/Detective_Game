import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	usersTable: {
		refreshTokens: r.many.refreshTokensTable({
			from: r.usersTable.id,
			to: r.refreshTokensTable.user_id,
		}),
		playerCases: r.many.playerCasesTable({
			from: r.usersTable.id,
			to: r.playerCasesTable.user_id,
		}),
	},
	refreshTokensTable: {
		user: r.one.usersTable({
			from: r.refreshTokensTable.user_id,
			to: r.usersTable.id,
		}),
	},
	casesTable: {
		/** L'enquête à avoir résolue avant que celle-ci ne se débloque. */
		unlockRequirement: r.one.casesTable({
			from: r.casesTable.unlock_requirement,
			to: r.casesTable.id,
		}),
		playerCases: r.many.playerCasesTable({
			from: r.casesTable.id,
			to: r.playerCasesTable.case_id,
		}),
	},
	playerCasesTable: {
		user: r.one.usersTable({
			from: r.playerCasesTable.user_id,
			to: r.usersTable.id,
		}),
		case: r.one.casesTable({
			from: r.playerCasesTable.case_id,
			to: r.casesTable.id,
		}),
	},
}));
