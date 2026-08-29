import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Lecture brute de la fixture, sans validation — isolée dans son propre module
 * pour que le test « le schéma valide-t-il verdier.json ? » puisse afficher
 * les écarts au lieu de mourir à l'import sur un `parse()` qui lève.
 */
const FIXTURE_URL = new URL(
	"../../../../content/verdier.json",
	import.meta.url,
);
const FIXTURE_PATH = fileURLToPath(FIXTURE_URL);

/**
 * `content/` est gitignoré (contenu narratif non publié, voir `.gitignore`) :
 * sur tout clone qui n'a pas ce dossier en local — CI, nouveau poste — le
 * fichier n'existe pas. `existsSync` ne lève jamais, contrairement à
 * `readFileSync` : c'est ce qui permet aux tests qui en dépendent de se
 * signaler `skip` au lieu de faire mourir tout le fichier à l'import.
 */
export const verdierFixtureExists = existsSync(FIXTURE_PATH);

export function readVerdierJson(): unknown {
	return JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
}
