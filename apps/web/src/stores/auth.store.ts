import type {
	AuthResponse,
	PublicUser,
} from "@repo/shared/schemas/auth.schema";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api } from "@/lib/http";

/** "unknown" tant que la tentative de restauration au démarrage n'a pas répondu. */
type AuthStatus = "unknown" | "authenticated" | "anonymous";

export const useAuthStore = defineStore("auth", () => {
	/**
	 * L'access token vit en mémoire uniquement, jamais dans localStorage :
	 * une faille XSS pourrait l'y lire. Il est donc perdu à chaque
	 * rechargement de page, et c'est restoreSession() qui le rétablit à
	 * partir du cookie httpOnly.
	 */
	const accessToken = ref<string | null>(null);
	const user = ref<PublicUser | null>(null);
	const status = ref<AuthStatus>("unknown");

	const isAuthenticated = computed(() => status.value === "authenticated");

	function setSession(session: AuthResponse) {
		accessToken.value = session.accessToken;
		user.value = session.user;
		status.value = "authenticated";
	}

	function clearSession() {
		accessToken.value = null;
		user.value = null;
		status.value = "anonymous";
	}

	async function runRefresh(): Promise<boolean> {
		try {
			setSession(await api<AuthResponse>("/auth/refresh", { method: "POST" }));

			return true;
		} catch {
			// Pas de cookie, cookie expiré ou révoqué : l'utilisateur est anonyme.
			clearSession();

			return false;
		}
	}

	/**
	 * Rejoue le cookie httpOnly pour obtenir un nouvel access token. Sert au
	 * démarrage (restauration après F5) et quand un appel prend un 401.
	 *
	 * La promesse en cours est partagée entre tous les appelants : le refresh
	 * est à rotation côté API, deux requêtes simultanées présenteraient le même
	 * token et l'API y verrait un rejeu - toutes les sessions seraient révoquées.
	 */
	let refreshPromise: Promise<boolean> | null = null;

	function refreshSession() {
		if (!refreshPromise) {
			refreshPromise = runRefresh().finally(() => {
				refreshPromise = null;
			});
		}

		return refreshPromise;
	}

	async function logout() {
		try {
			await api<void>("/auth/logout", { method: "POST" });
		} finally {
			// Même si l'appel échoue (API injoignable, cookie déjà expiré), on
			// considère la session terminée côté client : garder un token en
			// mémoire après un clic sur "Déconnexion" serait pire que tout.
			clearSession();
		}
	}

	return {
		accessToken,
		user,
		status,
		isAuthenticated,
		setSession,
		clearSession,
		refreshSession,
		logout,
	};
});
