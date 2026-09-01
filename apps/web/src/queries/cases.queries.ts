import { defineQuery, useMutation, useQuery } from "@pinia/colada";
import type { CasePreview } from "@repo/shared/game/public";
import type { PlayerState } from "@repo/shared/game/state";
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

export const useCaseBySlugQuery = (slug: string) =>
	defineQuery(() =>
		useQuery({
			key: ["cases", slug],
			query: () => api<CasePreview>(`/cases/${slug}`),
		}),
	)();

export const useCaseProgressQuery = (slug: string) =>
	defineQuery(() =>
		useQuery({
			key: ["cases", slug, "progress"],
			query: () => api<{ state: PlayerState }>(`/cases/${slug}/progress`),
		}),
	)();

export const useSaveProgressMutation = (slug: string) =>
	useMutation({
		mutation: (state: PlayerState) =>
			api<{ state: PlayerState }>(`/cases/${slug}/progress`, {
				method: "PUT",
				body: state,
			}),
	});
