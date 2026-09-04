import type { Ending } from "@repo/shared";
import type { PlayerState } from "@repo/shared/game/state";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import { casesTable, playerCasesTable } from "../../db/schema/index";

const casesRepository = {
	findBySlug: async (slug: string) => {
		const [caseRow] = await db
			.select()
			.from(casesTable)
			.where(and(eq(casesTable.slug, slug), eq(casesTable.is_published, true)))
			.limit(1);

		return caseRow;
	},

	findPlayerCase: async (userId: string, caseId: string) => {
		const [row] = await db
			.select()
			.from(playerCasesTable)
			.where(
				and(
					eq(playerCasesTable.user_id, userId),
					eq(playerCasesTable.case_id, caseId),
				),
			)
			.limit(1);

		return row;
	},

	findPublishedCases: async () => {
		return db
			.select()
			.from(casesTable)
			.where(eq(casesTable.is_published, true));
	},

	findPlayerCases: async (userId: string) => {
		return db
			.select()
			.from(playerCasesTable)
			.where(eq(playerCasesTable.user_id, userId));
	},

	upsertPlayerCase: async (
		userId: string,
		caseId: string,
		state: PlayerState,
	) => {
		const [row] = await db
			.insert(playerCasesTable)
			.values({ user_id: userId, case_id: caseId, state })
			.onConflictDoUpdate({
				target: [playerCasesTable.user_id, playerCasesTable.case_id],
				set: { state, updated_at: new Date() },
			})
			.returning();

		return row;
	},

	markSolved: async (userId: string, caseId: string, ending: Ending) => {
		const [row] = await db
			.update(playerCasesTable)
			.set({
				solved_at: new Date(),
				updated_at: new Date(),
				solved_ending: ending,
			})
			.where(
				and(
					eq(playerCasesTable.user_id, userId),
					eq(playerCasesTable.case_id, caseId),
					isNull(playerCasesTable.solved_at),
				),
			)
			.returning();

		return row;
	},

	findSolvedCases: async (userId: string) => {
		return db
			.select()
			.from(playerCasesTable)
			.where(
				and(
					eq(playerCasesTable.user_id, userId),
					isNotNull(playerCasesTable.solved_at),
				),
			)
			.innerJoin(casesTable, eq(casesTable.id, playerCasesTable.case_id));
	},
};

export default casesRepository;
