import type { PlayerState } from "@repo/shared/game/state";
import { jsonb, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { casesTable } from "./cases";
import { usersTable } from "./users";

/**
 * Une ligne = la sauvegarde d'un joueur sur une enquête. `state` stocke le
 * `PlayerState` (`playerStateSchema` dans `@repo/shared`) : clues, flags,
 * inventory, unlockedScenes, currentSceneId.
 *
 * `solved_at` est posé par la route de résolution (`POST /cases/:slug/solve`)
 * en cas de succès. C'est ce champ, pas `state`, qui sert à évaluer
 * `casesTable.unlock_requirement` d'une autre enquête ("ce joueur a-t-il
 * résolu la case X ?") sans avoir à interpréter le JSON de progression.
 */
export const playerCasesTable = pgTable(
	"player_cases",
	{
		id: uuid().primaryKey().defaultRandom(),
		user_id: uuid()
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		case_id: uuid()
			.notNull()
			.references(() => casesTable.id, { onDelete: "cascade" }),
		state: jsonb().$type<PlayerState>().notNull(),
		solved_at: timestamp(),
		updated_at: timestamp(),
		created_at: timestamp().defaultNow().notNull(),
	},
	(table) => [unique().on(table.user_id, table.case_id)],
);
