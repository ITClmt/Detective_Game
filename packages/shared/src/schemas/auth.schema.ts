import z from "zod";

const passwordSchema = z
	.string()
	.min(6, "Le mot de passe doit contenir au moins 6 caractères")
	.max(32, "Le mot de passe ne doit pas dépasser 32 caractères")
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
		"Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial",
	);

const registerSchema = z.object({
	username: z
		.string()
		.min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
		.max(32, "Le nom d'utilisateur ne doit pas dépasser 32 caractères"),
	email: z.email("Adresse email invalide"),
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
