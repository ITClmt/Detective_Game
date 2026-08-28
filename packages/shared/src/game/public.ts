import type { CaseFile } from "../schemas/case.schema";

/**
 * `GET /cases/:slug` ne doit jamais renvoyer `solution` : ce n'est pas une
 * histoire de triche (on l'accepte pour un joueur qui fouille), c'est un
 * spoiler immédiat — n'importe qui ouvrant l'onglet Réseau, même sans
 * intention de tricher, verrait la réponse avant d'avoir cliqué un seul
 * hotspot. `content` (scènes, indices, dialogues, `interaction.params.answer`
 * compris) part au client tel quel : c'est le reste de l'enquête à jouer.
 *
 * La résolution elle-même (`POST /cases/:slug/solve` ou équivalent) lit
 * `solution` côté serveur pour calculer le score et choisir l'ending, via
 * `scoreAnswers()`/`pickEnding()` de `game/engine.ts` — aucune logique en
 * plus à écrire, ces fonctions existent déjà.
 */
export type CasePreview = Omit<CaseFile, "solution">;

export function stripSolution(caseFile: CaseFile): CasePreview {
	const { solution: _solution, ...preview } = caseFile;
	return preview;
}
