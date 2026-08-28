import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Erreur métier : le code HTTP et le message sont volontairement exposables
 * au client. Tout ce qui n'est pas une AppError est traité comme une 500
 * anonyme par le handler global (voir src/index.ts).
 */
export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: string;
  readonly headers?: Record<string, string>;

  constructor(
    status: ContentfulStatusCode,
    code: string,
    message: string,
    headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

export const tooManyRequests = (
  code: string,
  message: string,
  limit: number,
  remaining: number,
  retryAfterSeconds: number,
) =>
  new AppError(429, code, message, {
    "RateLimit-Limit": String(limit),
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(retryAfterSeconds),
  });

export const badRequest = (code: string, message: string) =>
  new AppError(400, code, message);

export const unauthorized = (code: string, message: string) =>
  new AppError(401, code, message);

export const notFound = (code: string, message: string) =>
  new AppError(404, code, message);

export const conflict = (code: string, message: string) =>
  new AppError(409, code, message);

export const payloadTooLarge = (code: string, message: string) =>
  new AppError(413, code, message);
