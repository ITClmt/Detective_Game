import z from "zod";

/**
 * ============================================================================
 * LES TROIS SÉMANTIQUES D'ÉVALUATION — à ne jamais faire converger
 * ============================================================================
 *
 * Le format d'enquête utilise le *même* type `Condition` à plusieurs endroits,
 * mais l'interprète de trois façons différentes. Les confondre ne produit pas
 * une erreur : ça produit un bug silencieux (options dupliquées à l'écran,
 * branche jamais atteinte, ending toujours faux). D'où trois fonctions
 * distinctes dans le moteur, jamais une seule fonction générique.
 *
 * 1. EXCLUSIVE — `when` sur `hotspot.branches[]` et sur `scene.background[]`
 *    « la première entrée dont le `when` matche gagne ; l'entrée sans `when`
 *    sert de dernier recours et s'écrit donc EN DERNIER ». Une seule entrée
 *    est retenue.
 *    → moteur : `pickFirstMatch()`
 *
 * 2. ADDITIVE — `when` sur `dialogueNode.options[]`
 *    « toutes les options dont le `when` matche s'affichent simultanément ;
 *    une option sans `when` s'affiche toujours ». Zéro à N entrées retenues.
 *    → moteur : `filterAllMatches()`
 *    C'est le piège vécu sur `laya_studio` / nœud `interphone` : appliquer
 *    ici la sémantique exclusive fait disparaître des options, l'appliquer
 *    ailleurs les duplique.
 *
 * 3. RÉPONSES — `matchAnswers` sur `solution.endings[]`
 *    N'EST PAS une `Condition`. Le motif est comparé aux réponses données par
 *    le joueur à la résolution (`culprit` / `motive` / `method`), PAS à l'état
 *    de partie (clues / flags / items) — cet espace de noms n'existe même pas
 *    pendant l'exploration. Un évaluateur de `Condition` appliqué ici
 *    renverrait `false` en silence.
 *    → moteur : `matchAnswers()`, plus `pickEnding()` pour la sélection
 *      (exclusive, mais filtrée d'abord par `score`).
 *
 * ============================================================================
 */

/**
 * Grammaire des conditions, récursive et partagée par tous les `when`.
 *
 * `any` et `not` ne sont utilisés nulle part dans le contenu actuel : ils sont
 * prévus dès maintenant pour ne pas avoir à étendre la grammaire au coup par
 * coup — un ajout tardif obligerait à re-valider tout le contenu déjà écrit.
 */
export type Condition =
	| { hasClue: string }
	| { hasFlag: string }
	| { hasItem: string }
	| { clueCount: { gte: number } }
	| { all: Condition[] }
	| { any: Condition[] }
	| { not: Condition };

/**
 * Chaque variante est un `strictObject` à clé unique : `{ hasClue, hasFlag }`
 * est refusé à la validation. C'est ce qui autorise le moteur à déduire la
 * variante de la clé présente sans jamais avoir à *deviner* laquelle prime.
 */
export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
	z.union([
		z.strictObject({ hasClue: z.string().min(1) }),
		z.strictObject({ hasFlag: z.string().min(1) }),
		z.strictObject({ hasItem: z.string().min(1) }),
		z.strictObject({
			clueCount: z.strictObject({ gte: z.number().int().nonnegative() }),
		}),
		z.strictObject({ all: z.array(conditionSchema).min(1) }),
		z.strictObject({ any: z.array(conditionSchema).min(1) }),
		z.strictObject({ not: conditionSchema }),
	]),
);

/**
 * Les trois questions de résolution. Le tableau est figé parce que
 * `solution.answers` et `matchAnswers` portent exactement ces clés : ajouter
 * une question sans toucher aux deux autres structures casserait la
 * correspondance en silence, alors qu'ici la validation la refuse.
 */
export const RESOLUTION_QUESTION_IDS = ["culprit", "motive", "method"] as const;

export const resolutionQuestionIdSchema = z.enum(RESOLUTION_QUESTION_IDS);
export type ResolutionQuestionId = z.infer<typeof resolutionQuestionIdSchema>;

/** Réponses effectivement données par le joueur à la résolution. */
export const resolutionAnswersSchema = z.strictObject({
	culprit: z.string().min(1),
	motive: z.string().min(1),
	method: z.string().min(1),
});
export type ResolutionAnswers = z.infer<typeof resolutionAnswersSchema>;

/**
 * Motif de sélection d'un ending — sémantique n°3 ci-dessus.
 *
 * Schéma volontairement distinct de `Condition` : les deux ne partagent ni
 * l'espace de noms évalué, ni l'évaluateur. Les clés absentes ne contraignent
 * rien ; un motif entièrement vide est refusé, parce qu'un motif qui matche
 * tout est un ending sans `matchAnswers`, pas un motif vide (l'écrire ainsi
 * est toujours une erreur d'auteur).
 *
 * Les valeurs référencent les `id` d'options de `resolution.questions[]` —
 * cohérence non vérifiable structurellement par Zod, voir `case.schema.ts`.
 */
export const matchAnswersSchema = z
	.strictObject({
		culprit: z.string().min(1).optional(),
		motive: z.string().min(1).optional(),
		method: z.string().min(1).optional(),
	})
	.refine((pattern) => Object.keys(pattern).length > 0, {
		message: "matchAnswers vide : omettre la clé plutôt que de la laisser vide",
	});
export type MatchAnswers = z.infer<typeof matchAnswersSchema>;
