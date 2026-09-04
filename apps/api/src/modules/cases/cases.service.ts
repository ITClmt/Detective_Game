import {
	createPlayerState,
	type PlayerState,
	type PublicUser,
	pickEnding,
	playerStateSchema,
	type ResolutionAnswers,
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

	getSolvedCases: async (user: PublicUser) => {
		const caseRows = await casesRepository.findSolvedCases(user.id);

		return caseRows.map(({ cases, player_cases }) => ({
			...cases.content.case,
			ending: player_cases.solved_ending,
		}));
	},

	solve: async (user: PublicUser, slug: string, answers: ResolutionAnswers) => {
		const caseRow = await casesRepository.findBySlug(slug);

		if (!caseRow) {
			throw notFound("CASE_NOT_FOUND", "Enquête introuvable");
		}

		const progress = await casesRepository.findPlayerCase(user.id, caseRow.id);

		if (!progress) {
			throw notFound(
				"PROGRESS_NOT_FOUND",
				"Aucune partie en cours sur cette enquête",
			);
		}

		const result = pickEnding(caseRow.content.solution, answers);

		// Pas une AppError : c'est le contenu de l'enquête qui est incomplet
		// (aucune fin ne couvre ce score), pas la requête du client. Le handler
		// global le loggera et répondra 500.
		if (!result) {
			throw new Error(`Aucune fin ne couvre le score obtenu (${slug})`);
		}

		await casesRepository.markSolved(user.id, caseRow.id, result.ending);

		return { score: result.score, ending: result.ending };
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

	getPlayableCases: async (user: PublicUser) => {
		const [cases, playerCases] = await Promise.all([
			casesRepository.findPublishedCases(),
			casesRepository.findPlayerCases(user.id),
		]);

		// Un lookup O(1) par case_id, plutôt que .find() dans le tableau à chaque case.
		const progressByCaseId = new Map(playerCases.map((pc) => [pc.case_id, pc]));

		return cases
			.filter((caseRow) => {
				const requirement = caseRow.unlock_requirement;

				const unlocked =
					!requirement || !!progressByCaseId.get(requirement)?.solved_at;

				const notSolved = !progressByCaseId.get(caseRow.id)?.solved_at;

				return unlocked && notSolved;
			})
			.map((caseRow) => ({
				...caseRow.content.case,
				started: progressByCaseId.has(caseRow.id),
			}));
	},
};

export default casesService;
