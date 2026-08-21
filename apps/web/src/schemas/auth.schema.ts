import { z } from "zod";
import { registerSchema } from "@repo/shared/schemas/auth.schema";

export const registerFormSchema = registerSchema
	.extend({
		confirmPassword: z.string().min(1, "Confirmation requise"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Les mots de passe ne correspondent pas",
		path: ["confirmPassword"],
	});

export const loginFormSchema = z.object({
	email: z.email("Adresse email invalide"),
	password: z
		.string()
		.min(1, "Mot de passe requis")
		.max(32, "Mot de passe trop long"),
});
