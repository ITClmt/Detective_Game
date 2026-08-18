import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Erreur métier : le code HTTP et le message sont volontairement exposables
 * au client. Tout ce qui n'est pas une AppError est traité comme une 500
 * anonyme par le handler global (voir src/index.ts).
 */
export class AppError extends Error {
	readonly status: ContentfulStatusCode;
	readonly code: string;

	constructor(status: ContentfulStatusCode, code: string, message: string) {
		super(message);
		this.name = "AppError";
		this.status = status;
		this.code = code;
	}
}

export const badRequest = (code: string, message: string) =>
	new AppError(400, code, message);

export const unauthorized = (code: string, message: string) =>
	new AppError(401, code, message);

export const conflict = (code: string, message: string) =>
	new AppError(409, code, message);
