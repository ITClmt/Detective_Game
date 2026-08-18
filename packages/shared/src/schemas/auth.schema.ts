import z from "zod";

const passwordSchema = z
	.string()
	.min(6, "Password must be at least 6 characters long")
	.max(32, "Password must be at most 32 characters long")
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
		"Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
	);

const registerSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters long")
		.max(32, "Username must be at most 32 characters long"),
	email: z.email(),
	password: passwordSchema,
});

const loginSchema = z.object({
	email: z.email(),
	password: passwordSchema,
});

const publicUserSchema = z.object({
	id: z.uuid(),
	username: z.string(),
	email: z.email(),
	role: z.enum(["admin", "player"]),
});

/**
 * Le refresh token ne transite jamais dans le body : il vit dans un cookie
 * httpOnly. Cette réponse ne contient donc que l'access token (mémoire client).
 */
const authResponseSchema = z.object({
	user: publicUserSchema,
	accessToken: z.string(),
	expiresIn: z.number(), // durée de vie de l'access token, en secondes
});

export type RegisterParams = z.infer<typeof registerSchema>;
export type LoginParams = z.infer<typeof loginSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

export {
	authResponseSchema,
	loginSchema,
	passwordSchema,
	publicUserSchema,
	registerSchema,
};
