import { Hono } from "hono";
import type { AuthEnv } from "../../middlewares/auth.middleware";
import authController from "./auth.controller";

const authRoutes = new Hono<AuthEnv>();

authRoutes.post("/register", ...authController.register);
authRoutes.post("/login", ...authController.login);
/** Rejoue le cookie httpOnly pour obtenir un nouvel access token. */
authRoutes.post("/refresh", ...authController.refresh);
authRoutes.post("/logout", ...authController.logout);
authRoutes.get("/me", ...authController.me);

export default authRoutes;
