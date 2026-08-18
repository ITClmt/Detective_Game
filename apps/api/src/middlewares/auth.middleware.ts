import type { PublicUser } from "@repo/shared/schemas/auth.schema";
import { createMiddleware } from "hono/factory";
import { unauthorized } from "../lib/errors";
import authRepository from "../modules/auth/auth.repository";
import { verifyAccessToken } from "../modules/auth/auth.tokens";

export type AuthEnv = {
	Variables: {
		user: PublicUser;
	};
};

/**
 * Protège une route : exige un access token valide dans
 * `Authorization: Bearer <token>` et expose l'utilisateur via `c.get("user")`.
 */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
	const header = c.req.header("Authorization");
	const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

	if (!token) {
		throw unauthorized("MISSING_ACCESS_TOKEN", "missing access token");
	}

	let userId: string;

	try {
		const payload = await verifyAccessToken(token);
		userId = payload.sub;
	} catch {
		throw unauthorized("INVALID_ACCESS_TOKEN", "invalid access token");
	}

	// On relit l'utilisateur pour que la suppression d'un compte ou un
	// changement de rôle prenne effet sans attendre l'expiration du token.
	const user = await authRepository.findById(userId);

	if (!user) {
		throw unauthorized("USER_NOT_FOUND", "user not found");
	}

	c.set("user", user);

	await next();
});
