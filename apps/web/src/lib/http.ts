import { env } from "@/env";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Erreur métier renvoyée par l'API. Le back sérialise toujours ses erreurs
 * sous la forme { error: { code, message } } - on la remonte telle quelle
 * pour que l'appelant puisse distinguer un 409 d'une panne réseau.
 */
export class ApiError extends Error {
	status: number;
	code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
	}
}

type RequestOptions = {
	method?: "GET" | "POST" | "PUT";
	body?: unknown;
};

/** Envoie la requête. Aucune interprétation de la réponse. */
function request(path: string, options: RequestOptions) {
	const auth = useAuthStore();

	const headers = new Headers();
	if (options.body) {
		headers.set("Content-Type", "application/json");
	}
	if (auth.accessToken) {
		headers.set("Authorization", `Bearer ${auth.accessToken}`);
	}

	return fetch(`${env.VITE_API_URL}${path}`, {
		method: options.method ?? "GET",
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
		// Sans ça, le navigateur n'envoie pas le cookie de refresh.
		credentials: "include",
	});
}

/** Décode le corps, ou lève une ApiError. */
async function readBody<T>(response: Response): Promise<T> {
	// /auth/logout répond 204 : pas de corps à décoder.
	if (response.status === 204) {
		return undefined as T;
	}

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw new ApiError(
			response.status,
			data?.error?.code ?? "UNKNOWN_ERROR",
			data?.error?.message ?? "Une erreur est survenue",
		);
	}

	return data as T;
}

export async function api<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	let response = await request(path, options);

	// Access token expiré : on tente un refresh et on rejoue UNE fois.
	// Les routes /auth/* sont exclues, sinon un refresh qui échoue en
	// déclencherait un autre, indéfiniment.
	if (response.status === 401 && !path.startsWith("/auth/")) {
		const refreshed = await useAuthStore().refreshSession();

		if (refreshed) {
			response = await request(path, options);
		}
	}

	return readBody<T>(response);
}
