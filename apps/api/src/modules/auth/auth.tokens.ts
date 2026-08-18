import { createHash, randomBytes } from "node:crypto";
import { sign, verify } from "hono/jwt";
import { env } from "../../env";

export type AccessTokenPayload = {
	/** Id (uuid) de l'utilisateur. */
	sub: string;
	role: "admin" | "player";
	/** Expiration, en secondes depuis l'epoch. */
	exp: number;
};

const nowInSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Access token : JWT court, signé HS256, jamais stocké en base.
 * Il est self-contained : on le vérifie sans toucher à la DB.
 */
export const signAccessToken = async (user: {
	id: string;
	role: "admin" | "player";
}) => {
	const expiresIn = env.ACCESS_TOKEN_TTL;

	const payload: AccessTokenPayload = {
		sub: user.id,
		role: user.role,
		exp: nowInSeconds() + expiresIn,
	};

	const token = await sign(payload, env.JWT_ACCESS_SECRET, "HS256");

	return { token, expiresIn };
};

/** Lève une erreur (JwtTokenInvalid / JwtTokenExpired) si le token est mauvais. */
export const verifyAccessToken = async (token: string) => {
	const payload = (await verify(
		token,
		env.JWT_ACCESS_SECRET,
		"HS256",
	)) as AccessTokenPayload;

	return payload;
};

/**
 * Refresh token : valeur opaque aléatoire (pas un JWT). Le client reçoit la
 * valeur en clair dans un cookie httpOnly, la base ne stocke que son SHA-256 —
 * une fuite de la table ne permet donc pas de rejouer les sessions.
 */
export const generateRefreshToken = () => {
	const token = randomBytes(48).toString("base64url");
	const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL * 1000);

	return { token, tokenHash: hashRefreshToken(token), expiresAt };
};

export const hashRefreshToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");
