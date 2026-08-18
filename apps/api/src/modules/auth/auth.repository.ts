import type { RegisterParams } from "@repo/shared";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import { refreshTokensTable, usersTable } from "../../db/schema/index";

/** Colonnes renvoyées au client : jamais le hash du mot de passe. */
const publicUserColumns = {
	id: usersTable.id,
	username: usersTable.username,
	email: usersTable.email,
	role: usersTable.role,
};

const authRepository = {
	createUser: async (payload: RegisterParams) => {
		const [user] = await db
			.insert(usersTable)
			.values({
				username: payload.username,
				email: payload.email,
				password: payload.password,
			})
			.returning(publicUserColumns);

		return user;
	},

	/** Inclut le hash du mot de passe : réservé au login. */
	findByEmailWithPassword: async (email: string) => {
		const [user] = await db
			.select({ ...publicUserColumns, password: usersTable.password })
			.from(usersTable)
			.where(and(eq(usersTable.email, email), isNull(usersTable.deleted_at)))
			.limit(1);

		return user;
	},

	findById: async (id: string) => {
		const [user] = await db
			.select(publicUserColumns)
			.from(usersTable)
			.where(and(eq(usersTable.id, id), isNull(usersTable.deleted_at)))
			.limit(1);

		return user;
	},

	createRefreshToken: async (
		userId: string,
		tokenHash: string,
		expiresAt: Date,
	) => {
		const [token] = await db
			.insert(refreshTokensTable)
			.values({
				user_id: userId,
				token_hash: tokenHash,
				expires_at: expiresAt,
			})
			.returning();

		return token;
	},

	findRefreshTokenByHash: async (tokenHash: string) => {
		const [token] = await db
			.select()
			.from(refreshTokensTable)
			.where(eq(refreshTokensTable.token_hash, tokenHash))
			.limit(1);

		return token;
	},

	/** Révoque un token précis. Renvoie la ligne mise à jour, ou undefined si
	 * elle était déjà révoquée (garde-fou anti course entre deux refresh). */
	revokeRefreshToken: async (tokenHash: string) => {
		const [token] = await db
			.update(refreshTokensTable)
			.set({ revoked_at: new Date() })
			.where(
				and(
					eq(refreshTokensTable.token_hash, tokenHash),
					isNull(refreshTokensTable.revoked_at),
				),
			)
			.returning();

		return token;
	},

	/** Déconnexion globale : utilisée aussi en cas de rejeu détecté. */
	revokeAllRefreshTokensForUser: async (userId: string) => {
		await db
			.update(refreshTokensTable)
			.set({ revoked_at: new Date() })
			.where(
				and(
					eq(refreshTokensTable.user_id, userId),
					isNull(refreshTokensTable.revoked_at),
				),
			);
	},
};

export default authRepository;
