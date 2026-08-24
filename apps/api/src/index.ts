import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env";
import { AppError } from "./lib/errors";
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

app.route("/api/v1", router);

app.get("/ping", (c) => {
	return c.json({
		ok: true,
		message: "pong!",
	});
});

// Handler global : seules les AppError exposent leur message au client,
// le reste est loggé côté serveur et renvoyé en 500 anonyme.
app.onError((err, c) => {
	if (err instanceof AppError) {
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
