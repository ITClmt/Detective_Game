import z from "zod";

/**
 * État d'une partie — ce qui vit dans la ligne `player_cases` (colonnes ou
 * `jsonb`, la table reste à concevoir).
 *
 * C'est le seul espace de noms qu'évalue `evaluateCondition()`. Les réponses
 * de résolution n'en font PAS partie : elles n'existent qu'au moment de la
 * résolution et se comparent avec `matchAnswers()`.
 *
 * Toutes les collections sont des tableaux plutôt que des `Set` : cet état
 * doit pouvoir être sérialisé tel quel en JSON pour la base et pour le
 * client. Les volumes sont de l'ordre de la dizaine d'entrées, un `includes`
 * suffit largement.
 */
export interface PlayerState {
	/**
	 * Indices découverts. Absent de la liste donnée pour `player_cases` mais
	 * indispensable : `hasClue` et `clueCount` n'ont pas d'autre source.
	 */
	clues: string[];
	/** Faits acquis hors indices (aveu obtenu, mensonge repéré…). */
	flags: string[];
	/** Objets ramassés — `hasItem`, et l'inventaire à l'écran. */
	inventory: string[];
	/**
	 * Cache des scènes ouvertes. La vérité reste `scene.unlockWhen` évalué sur
	 * l'état ; on persiste la liste pour ne pas re-déclencher `unlockText` à
	 * chaque chargement et pour garder une scène ouverte même si la condition
	 * cessait d'être vraie.
	 */
	unlockedScenes: string[];
	/** Scène où le joueur reprendra la partie. */
	currentSceneId: string;
	/**
	 * Sujets de dialogue déjà joués, en `${characterId}.${nodeId}`.
	 *
	 * Le front s'en sert pour griser sans interdire : une option déjà jouée
	 * reste cliquable, elle est seulement signalée. Attention, la cible
	 * `dialogue.start` est le retour au menu et ne doit jamais être grisée —
	 * elle entre pourtant dans cette liste dès le premier aller-retour.
	 */
	seenDialogueNodes: string[];
}

export const playerStateSchema = z.strictObject({
	clues: z.array(z.string().min(1)),
	flags: z.array(z.string().min(1)),
	inventory: z.array(z.string().min(1)),
	unlockedScenes: z.array(z.string().min(1)),
	currentSceneId: z.string().min(1),
	seenDialogueNodes: z.array(z.string().min(1)),
});

/** État d'entrée d'une enquête : rien de découvert, sur la scène de départ. */
export function createPlayerState(startSceneId: string): PlayerState {
	return {
		clues: [],
		flags: [],
		inventory: [],
		unlockedScenes: [startSceneId],
		currentSceneId: startSceneId,
		seenDialogueNodes: [],
	};
}
