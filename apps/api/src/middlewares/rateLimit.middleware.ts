import { createMiddleware } from "hono/factory";
import { env } from "../env";
import { clientIp } from "../lib/clientIp";
import { tooManyRequests } from "../lib/errors";
import { memoryRateLimitStore } from "../lib/rateLimitStore";

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
		const remaining = limit - count <= 0 ? 0 : limit - count;

		if (count > limit) {
			throw tooManyRequests(
				"TOO_MANY_REQUESTS",
				"Too many requests, try again later",
				limit,
				remaining,
				retryAfter,
			);
		}

		// Renseigne le client avant qu'il ne se fasse couper.
		c.header("RateLimit-Limit", String(limit));
		c.header("RateLimit-Remaining", String(remaining));
		c.header("RateLimit-Reset", String(retryAfter));

		await next();
	});
