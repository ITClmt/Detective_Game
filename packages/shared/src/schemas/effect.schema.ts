import z from "zod";

/**
 * Vocabulaire d'effets, partagé par les branches de hotspot, les nœuds de
 * dialogue et les deux issues d'une `interaction`. Une nouvelle mécanique de
 * jeu ajoute une valeur d'`action` d'interaction et un composant côté front,
 * jamais un nouveau verbe d'effet à ce niveau.
 *
 * `showText` et `startDialogue` pilotent le rendu, pas l'état : `applyEffects`
 * les ignore volontairement (voir `game/engine.ts`).
 */
export type Effect =
	| { showText: string }
	| { addClue: string }
	| { addItem: string }
	| { setFlag: string }
	| { startDialogue: string }
	| { interaction: Interaction };

/**
 * Mécanique où le joueur doit *faire* quelque chose (taper un code, composer
 * une combinaison) et non seulement avoir vu un indice.
 *
 * `action` est le seul champ que le moteur connaît à l'avance : il sélectionne
 * le composant à monter côté front (`{ input: InputWidget, ... }`). `params`
 * est libre et propre à chaque `action` (`kind`/`length`/`answer` pour
 * `input`, autre chose pour une future serrure à combinaison).
 */
export interface Interaction {
	action: string;
	prompt: string;
	params: InteractionParams;
	onSuccess: Effect[];
	onFailure?: Effect[];
}

export type InteractionParams = { answer?: string } & Record<string, unknown>;

export const interactionParamsSchema = z.looseObject({
	answer: z.string().min(1).optional(),
});

/**
 * Chaque effet est un objet à clé unique (`{ "addClue": "..." }`), sans champ
 * `type` explicite. `strictObject` sur chaque variante suffit à lever
 * l'ambiguïté : un objet portant deux verbes, ou un verbe inconnu, est rejeté
 * à la validation plutôt que d'être interprété au hasard.
 */
export const effectSchema: z.ZodType<Effect> = z.lazy(() =>
	z.union([
		z.strictObject({ showText: z.string().min(1) }),
		z.strictObject({ addClue: z.string().min(1) }),
		z.strictObject({ addItem: z.string().min(1) }),
		z.strictObject({ setFlag: z.string().min(1) }),
		z.strictObject({ startDialogue: z.string().min(1) }),
		z.strictObject({
			interaction: z.strictObject({
				action: z.string().min(1),
				prompt: z.string().min(1),
				params: interactionParamsSchema,
				onSuccess: z.array(effectSchema),
				onFailure: z.array(effectSchema).optional(),
			}),
		}),
	]),
);

export const effectListSchema = z.array(effectSchema);
