import {
	createPlayerState,
	type PlayerState,
	type PublicUser,
	playerStateSchema,
} from "@repo/shared";
import { stripSolution } from "@repo/shared/game/public";
import { notFound } from "../../lib/errors";
import casesRepository from "./cases.repository";

const casesService = {
	getBySlug: async (slug: string) => {
		const caseRow = await casesRepository.findBySlug(slug);

		if (!caseRow) {
			throw notFound("CASE_NOT_FOUND", "Enquête introuvable");
		}

		return stripSolution(caseRow.content);
	},

	getProgress: async (user: PublicUser, slug: string) => {
		const caseRow = await casesRepository.findBySlug(slug);

		if (!caseRow) {
			throw notFound("CASE_NOT_FOUND", "Enquête introuvable");
		}

		const existing = await casesRepository.findPlayerCase(user.id, caseRow.id);

		// Revalidé à la relecture : une sauvegarde écrite avant une évolution du
		// format lève ici une erreur nette, au lieu de casser le front sur un
		// champ absent.
		if (existing) return playerStateSchema.parse(existing.state);

		const initialState = createPlayerState(caseRow.content.content.startScene);
		const created = await casesRepository.upsertPlayerCase(
			user.id,
			caseRow.id,
			initialState,
		);

		return created.state;
	},

	saveProgress: async (user: PublicUser, slug: string, state: PlayerState) => {
		const caseRow = await casesRepository.findBySlug(slug);

		if (!caseRow) {
			throw notFound("CASE_NOT_FOUND", "Enquête introuvable");
		}

		const saved = await casesRepository.upsertPlayerCase(
			user.id,
			caseRow.id,
			state,
		);

		return saved.state;
	},
};

export default casesService;
