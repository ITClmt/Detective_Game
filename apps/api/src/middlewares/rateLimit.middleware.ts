import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { createMiddleware } from "hono/factory";
import { env } from "../env";
import { tooManyRequests } from "../lib/errors";
import { memoryRateLimitStore } from "../lib/rateLimitStore";

/**
 * X-Forwarded-For a la forme "client, proxy1, proxy2" : la première valeur
 * est le client d'origine. Elle n'est digne de confiance que si un proxy
 * maîtrisé l'a écrite — sinon n'importe qui s'invente une IP par requête.
 */
const clientIp = (c: Context) => {
	if (env.TRUST_PROXY) {
		const forwarded = c.req.header("x-forwarded-for");
		const client = forwarded?.split(",")[0]?.trim();

		if (client) return client;
	}

	return getConnInfo(c).remote.address ?? "unknown";
};

type RateLimitOptions = {
	/** Sépare les compteurs : "login" et "register" ne partagent pas leur quota. */
	name: string;
	limit: number;
	windowMs: number;
};

export const rateLimit = ({ name, limit, windowMs }: RateLimitOptions) =>
	createMiddleware(async (c, next) => {
		if (!env.RATE_LIMIT_ENABLED) return next();

		const { count, resetAt } = await memoryRateLimitStore.hit(
			`${name}:${clientIp(c)}`,
			windowMs,
		);

		const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

		if (count > limit) {
			throw tooManyRequests(
				"TOO_MANY_REQUESTS",
				"Too many requests, try again later",
				retryAfter,
			);
		}

		// Renseigne le client avant qu'il ne se fasse couper.
		c.header("RateLimit-Limit", String(limit));
		c.header("RateLimit-Remaining", String(limit - count));
		c.header("RateLimit-Reset", String(retryAfter));

		await next();
	});
