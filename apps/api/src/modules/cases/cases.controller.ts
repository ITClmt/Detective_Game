import { playerStateSchema } from "@repo/shared/game/state";
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

export default { getBySlug, getProgress, saveProgress };
