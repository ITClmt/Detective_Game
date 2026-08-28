import { Hono } from "hono";
import type { AuthEnv } from "../../middlewares/auth.middleware";
import casesController from "./cases.controller";

const casesRoutes = new Hono<AuthEnv>();

casesRoutes.get("/:slug", ...casesController.getBySlug);

export default casesRoutes;
