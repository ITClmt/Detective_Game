import { readFileSync } from "node:fs";
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

export function readVerdierJson(): unknown {
	return JSON.parse(readFileSync(fileURLToPath(FIXTURE_URL), "utf8"));
}
