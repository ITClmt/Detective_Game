import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url(),
	FRONTEND_URL: z.url(),
	NODE_ENV: z.enum(["development", "production"]).default("development"),

	JWT_ACCESS_SECRET: z.string().min(32),
	/** Durée de vie d'un access token, en secondes (15 min par défaut). */
	ACCESS_TOKEN_TTL: z.coerce
		.number()
		.int()
		.positive()
		.default(60 * 15),
	/** Durée de vie d'un refresh token, en secondes (30 jours par défaut). */
	REFRESH_TOKEN_TTL: z.coerce
		.number()
		.int()
		.positive()
		.default(60 * 60 * 24 * 30),

	/**
	 * Nombre de proxies de confiance devant l'API.
	 * 0 = aucun (dev, ou conteneur joignable en direct)
	 * 1 = Traefik / Dokploy
	 * 2 = Cloudflare puis Traefik
	 */
	TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).default(0),

	/** Coupe-circuit pour le dev et la suite Bruno, qui rejouent les mêmes appels. */
	RATE_LIMIT_ENABLED: z
		.enum(["true", "false"])
		.default("true")
		.transform((value) => value === "true"),
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
