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
	 * Autorise la lecture de X-Forwarded-For pour identifier le client.
	 * À true UNIQUEMENT derrière un proxy de confiance (Traefik) : si l'API
	 * est joignable en direct, l'en-tête est fourni par l'appelant et le rate
	 * limit se contourne en changeant une ligne de curl.
	 */
	TRUST_PROXY: z
		.enum(["true", "false"])
		.default("false")
		.transform((value) => value === "true"),

	/** Coupe-circuit pour le dev et la suite Bruno, qui rejouent les mêmes appels. */
	RATE_LIMIT_ENABLED: z
		.enum(["true", "false"])
		.default("true")
		.transform((value) => value === "true"),

	/** Nombre maximum de hachages argon2 simultanés (chaque hash réserve ~64 Mo). */
	PASSWORD_HASH_CONCURRENCY: z.coerce.number().int().positive().default(4),
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
