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
};

export default casesService;
