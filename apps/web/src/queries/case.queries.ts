import { useMutation, useQuery } from "@pinia/colada";
import type { CasePreview } from "@repo/shared/game/public";
import type { PlayerState } from "@repo/shared/game/state";
import type { Ending } from "@repo/shared/schemas/case.schema";
import type { ResolutionAnswers } from "@repo/shared/schemas/condition.schema";
import { type MaybeRefOrGetter, toValue } from "vue";
import { api } from "@/lib/http";

/** Contenu d'une enquête (scènes, hotspots, dialogues) — sans `solution`. */
export function useCaseQuery(slug: MaybeRefOrGetter<string>) {
	return useQuery({
		key: () => ["cases", toValue(slug)],
		query: () => api<CasePreview>(`/cases/${toValue(slug)}`),
	});
}

/** Progression du joueur courant sur cette enquête (créée au premier appel). */
export function useCaseProgressQuery(slug: MaybeRefOrGetter<string>) {
	return useQuery({
		key: () => ["cases", toValue(slug), "progress"],
		query: () =>
			api<{ state: PlayerState }>(`/cases/${toValue(slug)}/progress`).then(
				(res) => res.state,
			),
	});
}

export function useSaveProgressMutation(slug: MaybeRefOrGetter<string>) {
	return useMutation({
		mutation: (state: PlayerState) =>
			api<{ state: PlayerState }>(`/cases/${toValue(slug)}/progress`, {
				method: "PUT",
				body: state,
			}),
	});
}

export function useSolveCaseMutation(slug: MaybeRefOrGetter<string>) {
	return useMutation({
		mutation: (answers: ResolutionAnswers) =>
			api<{ score: number; ending: Ending }>(`/cases/${toValue(slug)}/solve`, {
				method: "POST",
				body: answers,
			}),
	});
}
