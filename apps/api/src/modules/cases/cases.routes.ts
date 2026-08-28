import { Hono } from "hono";
import type { AuthEnv } from "../../middlewares/auth.middleware";
import casesController from "./cases.controller";

const casesRoutes = new Hono<AuthEnv>();

casesRoutes.get("/:slug", ...casesController.getBySlug);
casesRoutes.get("/:slug/progress", ...casesController.getProgress);
casesRoutes.put("/:slug/progress", ...casesController.saveProgress);
casesRoutes.post("/:slug/solve", ...casesController.solveCase);

export default casesRoutes;
