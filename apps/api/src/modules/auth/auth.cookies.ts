import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { env, isProduction } from "../../env";

export const REFRESH_COOKIE_NAME = "refresh_token";

/**
 * Le cookie n'est renvoyé que sur les routes d'auth : inutile de le trimballer
 * sur tous les appels API, ça réduit la surface d'exposition.
 */
const REFRESH_COOKIE_PATH = "/api/v1/auth";

const baseOptions = {
	httpOnly: true, // inaccessible en JS → immunisé au vol par XSS
	secure: isProduction,
	sameSite: "lax", // "none" + secure si le front est sur un autre domaine
	path: REFRESH_COOKIE_PATH,
} as const;

export const setRefreshCookie = (c: Context, token: string) => {
	setCookie(c, REFRESH_COOKIE_NAME, token, {
		...baseOptions,
		maxAge: env.REFRESH_TOKEN_TTL,
	});
};

export const getRefreshCookie = (c: Context) =>
	getCookie(c, REFRESH_COOKIE_NAME);

export const clearRefreshCookie = (c: Context) => {
	deleteCookie(c, REFRESH_COOKIE_NAME, baseOptions);
};
