import { playerStateSchema } from "@repo/shared/game/state";
import { resolutionAnswersSchema } from "@repo/shared/schemas/condition.schema";
import { createFactory } from "hono/factory";
import { jsonValidator } from "../../lib/validator";
import type { AuthEnv } from "../../middlewares/auth.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import casesService from "./cases.service";

const factory = createFactory<AuthEnv, "/:slug">();

const getBySlug = factory.createHandlers(requireAuth, async (c) => {
	const slug = c.req.param("slug");
	const preview = await casesService.getBySlug(slug);

	return c.json(preview);
});

const getProgress = factory.createHandlers(requireAuth, async (c) => {
	const slug = c.req.param("slug");
	const user = c.get("user");
	const state = await casesService.getProgress(user, slug);

	return c.json({ state });
});

const saveProgress = factory.createHandlers(
	requireAuth,
	jsonValidator(playerStateSchema),
	async (c) => {
		const slug = c.req.param("slug");
		const user = c.get("user");

		const state = await casesService.saveProgress(
			user,
			slug,
			c.req.valid("json"),
		);

		return c.json({ state });
	},
);

const solveCase = factory.createHandlers(
	requireAuth,
	jsonValidator(resolutionAnswersSchema),
	async (c) => {
		const slug = c.req.param("slug");
		const user = c.get("user");

		const result = await casesService.solve(user, slug, c.req.valid("json"));
		return c.json(result);
	},
);

const getPlayableCases = factory.createHandlers(requireAuth, async (c) => {
	const user = c.get("user");
	const cases = await casesService.getPlayableCases(user);

	return c.json(cases);
});

const getSolvedCases = factory.createHandlers(requireAuth, async (c) => {
	const user = c.get("user");
	const cases = await casesService.getSolvedCases(user);

	return c.json(cases);
});

export default {
	getSolvedCases,
	getBySlug,
	getProgress,
	saveProgress,
	solveCase,
	getPlayableCases,
};
