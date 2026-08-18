import type {
	LoginParams,
	PublicUser,
	RegisterParams,
} from "@repo/shared/schemas/auth.schema";
import { conflict, unauthorized } from "../../lib/errors";
import authRepository from "./auth.repository";
import {
	generateRefreshToken,
	hashRefreshToken,
	signAccessToken,
} from "./auth.tokens";

/**
 * Hash bidon utilisé quand l'email n'existe pas : on vérifie quand même un
 * mot de passe pour que login réponde en un temps constant et ne laisse pas
 * deviner quels emails sont enregistrés.
 */
const DUMMY_PASSWORD_HASH = await Bun.password.hash("dummy-password");

type Session = {
	user: PublicUser;
	accessToken: string;
	expiresIn: number;
	refreshToken: string;
};

/** Émet un nouveau couple access + refresh et persiste le hash du refresh. */
const issueSession = async (user: PublicUser): Promise<Session> => {
	const { token: accessToken, expiresIn } = await signAccessToken(user);
	const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

	await authRepository.createRefreshToken(user.id, tokenHash, expiresAt);

	return { user, accessToken, expiresIn, refreshToken };
};

const authService = {
	register: async (payload: RegisterParams): Promise<Session> => {
		const existing = await authRepository.findByEmailWithPassword(
			payload.email,
		);

		if (existing) {
			throw conflict("ERROR_REGISTER", "error while registering");
		}

		const password = await Bun.password.hash(payload.password);

		const user = await authRepository.createUser({
			username: payload.username,
			email: payload.email,
			password,
		});

		if (!user) {
			throw new Error("User creation returned no row");
		}

		return issueSession(user);
	},

	login: async (payload: LoginParams): Promise<Session> => {
		const found = await authRepository.findByEmailWithPassword(payload.email);

		const isValid = await Bun.password.verify(
			payload.password,
			found?.password ?? DUMMY_PASSWORD_HASH,
		);

		if (!found || !isValid) {
			throw unauthorized("INVALID_CREDENTIALS", "Invalid credentials");
		}

		const { password: _password, ...user } = found;

		return issueSession(user);
	},

	/**
	 * Rotation : le refresh présenté est révoqué et remplacé par un nouveau.
	 * Si on retrouve un token déjà révoqué, c'est un rejeu (cookie volé ou
	 * restauré) → on coupe toutes les sessions de l'utilisateur.
	 */
	refresh: async (refreshToken: string): Promise<Session> => {
		const invalid = () =>
			unauthorized("INVALID_REFRESH_TOKEN", "Invalid refresh token");

		const stored = await authRepository.findRefreshTokenByHash(
			hashRefreshToken(refreshToken),
		);

		if (!stored) {
			throw invalid();
		}

		if (stored.revoked_at) {
			await authRepository.revokeAllRefreshTokensForUser(stored.user_id);
			throw invalid();
		}

		if (stored.expires_at.getTime() <= Date.now()) {
			throw invalid();
		}

		// Révocation conditionnelle : si une requête concurrente a déjà consommé
		// ce token, aucune ligne n'est retournée et on refuse la rotation.
		const revoked = await authRepository.revokeRefreshToken(stored.token_hash);

		if (!revoked) {
			throw invalid();
		}

		const user = await authRepository.findById(stored.user_id);

		if (!user) {
			throw invalid();
		}

		return issueSession(user);
	},

	/** Idempotent : un cookie absent ou déjà révoqué n'est pas une erreur. */
	logout: async (refreshToken?: string) => {
		if (!refreshToken) return;

		await authRepository.revokeRefreshToken(hashRefreshToken(refreshToken));
	},
};

export default authService;
