import { defineQuery, useQuery } from "@pinia/colada";
import type { CaseMeta } from "@repo/shared/schemas/case.schema";
import { api } from "@/lib/http";

/** Entrée de `GET /cases/playable` : métadonnées d'enquête + progression du joueur. */
export type PlayableCase = CaseMeta & { started: boolean };

/**
 * Enquêtes jouables par le joueur courant (débloquées, non résolues).
 * `defineQuery` partage un seul état entre tous les appelants : plusieurs
 * composants qui l'utilisent en même temps ne déclenchent qu'une requête.
 */
export const usePlayableCasesQuery = defineQuery(() =>
	useQuery({
		key: ["cases", "playable"],
		query: () => api<PlayableCase[]>("/cases/playable"),
	}),
);
