import { createFactory } from "hono/factory";
import type { AuthEnv } from "../../middlewares/auth.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import casesService from "./cases.service";

const factory = createFactory<AuthEnv, "/:slug">();

const getBySlug = factory.createHandlers(requireAuth, async (c) => {
	const slug = c.req.param("slug");
	const preview = await casesService.getBySlug(slug);

	return c.json(preview);
});

export default { getBySlug };
