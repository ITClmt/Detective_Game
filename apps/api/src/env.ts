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
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
