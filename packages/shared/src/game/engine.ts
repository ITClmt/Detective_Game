import type { Ending, Scene, Solution } from "../schemas/case.schema";
import type {
	Condition,
	MatchAnswers,
	ResolutionAnswers,
} from "../schemas/condition.schema";
import { RESOLUTION_QUESTION_IDS } from "../schemas/condition.schema";
import type { Effect } from "../schemas/effect.schema";
import type { PlayerState } from "./state";

/**
 * Moteur de jeu : lit le JSON d'une enquête et l'état de progression du
 * joueur, en déduit ce qu'il faut afficher. C'est le front qui l'utilise, à
 * chaque clic — le back ne fait que stocker le `PlayerState` que le front lui
 * envoie, il ne rejoue rien de ce fichier.
 *
 * Le format utilise le même type `Condition` à trois endroits différents,
 * mais avec trois sens différents. Les confondre ne plante pas, ça produit un
 * bug silencieux (options en double à l'écran, branche jamais atteinte...).
 * D'où trois fonctions séparées, qui ne s'appellent jamais entre elles :
 *
 * 1. EXCLUSIVE — `hotspot.branches[]`, `scene.background[]`
 *    La première entrée dont le `when` matche gagne ; l'entrée sans `when`
 *    sert de dernier recours (à écrire en dernier).
 *    → `pickFirstMatch()`
 *
 * 2. ADDITIVE — `dialogueNode.options[]`
 *    Toutes les entrées dont le `when` matche s'affichent en même temps.
 *    → `filterAllMatches()`
 *
 * 3. RÉPONSES — `matchAnswers` sur `solution.endings[]`
 *    N'est pas une `Condition` : compare les réponses données à la
 *    résolution (`culprit`/`motive`/`method`), pas l'état de partie.
 *    → `matchAnswers()`, puis `pickEnding()` pour choisir la fin.
 */

/** Évalue une condition (`when`) sur l'état de partie du joueur. */
export function evaluateCondition(
	condition: Condition,
	state: PlayerState,
): boolean {
	if ("hasClue" in condition) return state.clues.includes(condition.hasClue);
	if ("hasFlag" in condition) return state.flags.includes(condition.hasFlag);
	if ("hasItem" in condition) {
		return state.inventory.includes(condition.hasItem);
	}
	if ("clueCount" in condition) {
		return state.clues.length >= condition.clueCount.gte;
	}
	if ("all" in condition) {
		return condition.all.every((child) => evaluateCondition(child, state));
	}
	if ("any" in condition) {
		return condition.any.some((child) => evaluateCondition(child, state));
	}
	if ("not" in condition) return !evaluateCondition(condition.not, state);

	throw new Error(`Condition non reconnue : ${JSON.stringify(condition)}`);
}

/**
 * Sémantique EXCLUSIVE — branches de hotspot, variantes de fond de scène.
 * Renvoie la première entrée dont le `when` matche, `undefined` si aucune
 * (un tableau sans catch-all est valide, ce n'est pas une erreur).
 */
export function pickFirstMatch<T extends { when?: Condition }>(
	list: readonly T[],
	state: PlayerState,
): T | undefined {
	return list.find(
		(entry) => entry.when === undefined || evaluateCondition(entry.when, state),
	);
}

/**
 * Sémantique ADDITIVE — options d'un nœud de dialogue.
 * Renvoie toutes les entrées dont le `when` matche.
 */
export function filterAllMatches<T extends { when?: Condition }>(
	list: readonly T[],
	state: PlayerState,
): T[] {
	return list.filter(
		(entry) => entry.when === undefined || evaluateCondition(entry.when, state),
	);
}

/**
 * Sémantique RÉPONSES — `matchAnswers` d'un ending.
 * Compare un motif aux réponses données à la résolution. Une clé absente du
 * motif ne contraint rien.
 */
export function matchAnswers(
	pattern: MatchAnswers,
	answers: ResolutionAnswers,
): boolean {
	return RESOLUTION_QUESTION_IDS.every((questionId) => {
		const expected = pattern[questionId];
		return expected === undefined || expected === answers[questionId];
	});
}

/** Nombre de bonnes réponses (0 à 3) — c'est le `score` porté par un ending. */
export function scoreAnswers(
	solutionAnswers: ResolutionAnswers,
	given: ResolutionAnswers,
): number {
	return RESOLUTION_QUESTION_IDS.filter(
		(questionId) => given[questionId] === solutionAnswers[questionId],
	).length;
}

/**
 * Choisit la fin à afficher : `score` filtre d'abord les fins candidates,
 * puis `matchAnswers` départage entre elles (première qui matche ; celle sans
 * `matchAnswers` sert de catch-all du score, à écrire en dernier parmi ses
 * pairs de même score).
 */
export function pickEnding(
	solution: Solution,
	given: ResolutionAnswers,
): { ending: Ending; score: number } | undefined {
	const score = scoreAnswers(solution.answers, given);
	const ending = solution.endings.find(
		(candidate) =>
			candidate.score === score &&
			(candidate.matchAnswers === undefined ||
				matchAnswers(candidate.matchAnswers, given)),
	);
	return ending === undefined ? undefined : { ending, score };
}

/** Fond à afficher pour une scène : chaîne fixe, ou première variante qui matche. */
export function resolveBackground(
	scene: Scene,
	state: PlayerState,
): string | undefined {
	if (typeof scene.background === "string") return scene.background;
	return pickFirstMatch(scene.background, state)?.image;
}

/**
 * Applique une liste d'effets et renvoie le nouvel état, sans muter celui
 * reçu (le front s'appuie sur le changement de référence pour re-rendre).
 *
 * `showText`, `startDialogue` et `interaction` ne changent pas l'état : c'est
 * à l'appelant de les lire pour savoir quoi afficher. `interaction` en
 * particulier attend une action du joueur — ses `onSuccess`/`onFailure`
 * repassent par `applyEffects` une fois la réponse connue, pas avant.
 */
export function applyEffects(
	state: PlayerState,
	effects: readonly Effect[],
): PlayerState {
	const next: PlayerState = {
		...state,
		clues: [...state.clues],
		flags: [...state.flags],
		inventory: [...state.inventory],
		unlockedScenes: [...state.unlockedScenes],
	};

	for (const effect of effects) {
		if ("addClue" in effect) pushUnique(next.clues, effect.addClue);
		else if ("addItem" in effect) pushUnique(next.inventory, effect.addItem);
		else if ("setFlag" in effect) pushUnique(next.flags, effect.setFlag);
	}

	return next;
}

/** Les collections d'état sont des ensembles : rejouer un effet est neutre. */
function pushUnique(list: string[], value: string): void {
	if (!list.includes(value)) list.push(value);
}

/**
 * Clé d'un sujet de dialogue. Centralisée ici pour que le front et la
 * sauvegarde ne puissent pas diverger sur le séparateur — un `.` d'un côté et
 * un `:` de l'autre feraient cesser le grisage sans lever d'erreur.
 */
export function dialogueNodeKey(characterId: string, nodeId: string): string {
	return `${characterId}.${nodeId}`;
}

export function hasSeenNode(
	state: PlayerState,
	characterId: string,
	nodeId: string,
): boolean {
	return state.seenDialogueNodes.includes(dialogueNodeKey(characterId, nodeId));
}

/** Marque un nœud comme joué, sans muter l'état reçu (cf. `applyEffects`). */
export function markNodeSeen(
	state: PlayerState,
	characterId: string,
	nodeId: string,
): PlayerState {
	const next = { ...state, seenDialogueNodes: [...state.seenDialogueNodes] };
	pushUnique(next.seenDialogueNodes, dialogueNodeKey(characterId, nodeId));
	return next;
}
