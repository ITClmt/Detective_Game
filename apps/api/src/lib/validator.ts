import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { badRequest } from "./errors";

/**
 * En échec, zValidator répond lui-même en 400 avec le ZodError brut, sans
 * passer par app.onError : le client recevrait deux enveloppes d'erreur
 * différentes selon qu'il s'agit d'une validation ou d'une erreur métier,
 * et la structure interne de Zod se retrouverait exposée.
 *
 * Le hook rebascule la validation dans AppError pour garder partout la même
 * forme { error: { code, message } }.
 */
export const jsonValidator = <T extends ZodType>(schema: T) =>
	zValidator("json", schema, (result) => {
		if (!result.success) {
			throw badRequest(
				"VALIDATION_ERROR",
				result.error.issues[0]?.message ?? "Requête invalide",
			);
		}
	});
