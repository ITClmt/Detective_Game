import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";

/**
 * Applique les migrations en attente, puis rend la main.
 *
 * On passe par le migrator de `drizzle-orm` et non par `drizzle-kit migrate` :
 * drizzle-kit est une devDependency, absente de l'image de production (voir
 * le `bun install --production` du Dockerfile). Le migrator, lui, vit dans
 * `drizzle-orm`, qui est une dépendance de production.
 */

// Résolu depuis ce fichier et non depuis le cwd : le script tourne aussi bien
// à la main depuis apps/api qu'au démarrage du conteneur.
const migrationsFolder = fileURLToPath(
	new URL("../../drizzle", import.meta.url),
);

try {
	await migrate(db, { migrationsFolder });
	console.log("Migrations appliquées.");
} finally {
	// Sans ça le pool garde le process en vie et le conteneur ne démarre jamais.
	await pool.end();
}
