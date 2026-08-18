import type { AuthResponse } from "@repo/shared/schemas/auth.schema";
import { loginSchema, registerSchema } from "@repo/shared/schemas/auth.schema";
import type { Context } from "hono";
import { createFactory } from "hono/factory";
import { jsonValidator } from "../../lib/validator";
import type { AuthEnv } from "../../middlewares/auth.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
	clearRefreshCookie,
	getRefreshCookie,
	setRefreshCookie,
} from "./auth.cookies";
import authService from "./auth.service";

const factory = createFactory<AuthEnv>();

type Session = Awaited<ReturnType<typeof authService.login>>;

/** Le refresh part en cookie httpOnly, l'access token dans le body. */
const sendSession = (c: Context, session: Session, status: 200 | 201) => {
	setRefreshCookie(c, session.refreshToken);

	const body: AuthResponse = {
		user: session.user,
		accessToken: session.accessToken,
		expiresIn: session.expiresIn,
	};

	return c.json(body, status);
};

const register = factory.createHandlers(
	jsonValidator(registerSchema),
	async (c) => {
		const session = await authService.register(c.req.valid("json"));

		return sendSession(c, session, 201);
	},
);

const login = factory.createHandlers(jsonValidator(loginSchema), async (c) => {
	const session = await authService.login(c.req.valid("json"));

	return sendSession(c, session, 200);
});

const refresh = factory.createHandlers(async (c) => {
	const session = await authService.refresh(getRefreshCookie(c) ?? "");

	return sendSession(c, session, 200);
});

const logout = factory.createHandlers(async (c) => {
	await authService.logout(getRefreshCookie(c));
	clearRefreshCookie(c);

	return c.body(null, 204);
});

const me = factory.createHandlers(requireAuth, (c) =>
	c.json({ user: c.get("user") }),
);

export default { register, login, refresh, logout, me };
