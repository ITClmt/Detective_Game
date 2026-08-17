import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url(),
	FRONTEND_URL: z.url(),
	NODE_ENV: z.enum(["development", "production"]).default("development"),
});

export const env = envSchema.parse(process.env);
