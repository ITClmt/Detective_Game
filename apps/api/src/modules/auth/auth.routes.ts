import { Hono } from "hono";
import type { AuthEnv } from "../../middlewares/auth.middleware";
import { rateLimit } from "../../middlewares/rateLimit.middleware";
import authController from "./auth.controller";

// Rate Limiting configuration
const MINUTE = 60 * 1000;

const loginLimiter = rateLimit({
	name: "login",
	limit: 10,
	windowMs: 15 * MINUTE,
});

const registerLimiter = rateLimit({
	name: "register",
	limit: 5,
	windowMs: 60 * MINUTE,
});

const refreshLimiter = rateLimit({
	name: "refresh",
	limit: 30,
	windowMs: 15 * MINUTE,
});

// Routes

const authRoutes = new Hono<AuthEnv>();

authRoutes.post("/register", registerLimiter, ...authController.register);
authRoutes.post("/login", loginLimiter, ...authController.login);
/** Rejoue le cookie httpOnly pour obtenir un nouvel access token. */
authRoutes.post("/refresh", refreshLimiter, ...authController.refresh);
authRoutes.post("/logout", ...authController.logout);
authRoutes.get("/me", ...authController.me);

export default authRoutes;
