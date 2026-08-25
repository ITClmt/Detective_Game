import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env";
import { clientIp } from "./lib/clientIp";
import { AppError, payloadTooLarge } from "./lib/errors";
import router from "./router";

const app = new Hono();

// Middleware pour logger les requêtes
app.use("*", logger());

// Middleware pour sécuriser les en-têtes HTTP
app.use("*", secureHeaders());

// Middleware pour gérer le CORS.
app.use(
	"*",
	cors({
		origin: env.FRONTEND_URL,
		credentials: true,
	}),
);

app.use(
	"*",
	bodyLimit({
		maxSize: 100 * 1024, // 100 Ko — le plus gros corps légitime fait ~200 octets
		onError: () => {
			throw payloadTooLarge("PAYLOAD_TOO_LARGE", "Request body too large");
		},
	}),
);

app.route("/api/v1", router);

app.get("/ping", (c) => {
	return c.json({
		ok: true,
		message: "pong!",
	});
});

const AUDITED_CODES = new Set([
	"TOO_MANY_REQUESTS",
	"INVALID_CREDENTIALS",
	"INVALID_REFRESH_TOKEN",
	"ERROR_REGISTER",
]);

// Handler global : seules les AppError exposent leur message au client,
// le reste est loggé côté serveur et renvoyé en 500 anonyme.
app.onError((err, c) => {
	if (err instanceof AppError) {
		// Une ligne JSON par rejet : greppable dans les logs Dokploy.
		if (AUDITED_CODES.has(err.code)) {
			console.warn(
				JSON.stringify({
					event: "auth.rejected",
					code: err.code,
					status: err.status,
					method: c.req.method,
					path: c.req.path,
					ip: clientIp(c),
					at: new Date().toISOString(),
				}),
			);
		}

		return c.json(
			{ error: { code: err.code, message: err.message } },
			err.status,
			err.headers,
		);
	}

	console.error(err);

	return c.json(
		{
			error: {
				code: "INTERNAL_SERVER_ERROR",
				message: "Une erreur est survenue",
			},
		},
		500,
	);
});

export default app;
