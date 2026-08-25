import { registerSchema } from "@repo/shared/schemas/auth.schema";
import { z } from "zod";

export const registerFormSchema = registerSchema
	.extend({
		confirmPassword: z.string().min(1, "Confirmation requise"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Les mots de passe ne correspondent pas",
		path: ["confirmPassword"],
	});

export { loginSchema as loginFormSchema } from "@repo/shared/schemas/auth.schema";
