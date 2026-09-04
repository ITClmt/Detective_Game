import z from "zod";
import {
	conditionSchema,
	matchAnswersSchema,
	resolutionAnswersSchema,
	resolutionQuestionIdSchema,
} from "./condition.schema";
import { effectSchema } from "./effect.schema";

/**
 * Schéma du format d'enquête : le JSON unique stocké dans la colonne `jsonb`
 * de la table `cases`.
 *
 * Trois blocs volontairement séparés à la racine :
 *  - `case`     : métadonnées de l'affaire (ce qui alimente la liste et la
 *                 boîte mail du hub) ;
 *  - `content`  : tout ce que le joueur peut voir — scènes, indices, objets,
 *                 personnages, dialogues, résolution ;
 *  - `solution` : les bonnes réponses et les fins. Le jeu est solo et sans
 *                 classement, donc pas de *revalidation métier* côté serveur
 *                 (l'API ne vérifie jamais `resolution.unlockWhen` avant
 *                 d'accepter une résolution). Ce bloc reste néanmoins retenu
 *                 côté serveur : `GET /cases/:slug` le retire via
 *                 `stripSolution()` (voir `game/public.ts`), sans quoi
 *                 n'importe qui ouvrant l'onglet Réseau verrait le coupable
 *                 avant d'avoir cliqué un seul hotspot. Seule
 *                 `POST /cases/:slug/solve` le lit, côté serveur.
 *
 * Tous les objets sont `strict` : une clé inconnue est une faute de frappe
 * d'auteur, pas une extension. Le format évolue par le schéma, pas par le
 * contenu.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CE SCHÉMA NE PEUT PAS VÉRIFIER — à confier à un lint de contenu
 * ---------------------------------------------------------------------------
 * Zod valide une structure, pas un graphe. Restent hors de portée ici :
 *  - `content.startScene` et les effets `startDialogue` référencent des ids
 *    existants ;
 *  - `addClue` / `addItem` / `hasClue` / `hasItem` référencent un `clues[].id`
 *    ou un `items[].id` déclaré ;
 *  - `dialogue.start` et `option.goto` désignent un nœud existant du même
 *    dialogue, et tout nœud est atteignable ;
 *  - `dialogue.characterId` désigne un `characters[].id` ;
 *  - les ids sont uniques dans chaque tableau (clues, items, characters,
 *    scenes, hotspots d'une scène) ;
 *  - **la cohérence des ids de résolution** : `resolution.questions[]` doit
 *    couvrir les trois ids figés (`culprit`, `motive`, `method`), et la valeur
 *    portée par `solution.answers[id]` — comme celles de `matchAnswers` — doit
 *    correspondre à l'un des `options[].id` de la question de même id. Rien ne
 *    le garantit structurellement : une faute de frappe rend simplement le 3/3
 *    inatteignable, sans erreur ;
 *  - une entrée catch-all (sans `when`) placée ailleurs qu'en dernier dans un
 *    tableau à sémantique exclusive (`branches`, `background`) rend
 *    inatteignable tout ce qui la suit.
 */

/** Rectangle cliquable, en pourcentages du fond (origine en haut à gauche). */
export const hotspotAreaSchema = z.strictObject({
	x: z.number().min(0).max(100),
	y: z.number().min(0).max(100),
	w: z.number().min(0).max(100),
	h: z.number().min(0).max(100),
});
export type HotspotArea = z.infer<typeof hotspotAreaSchema>;

/**
 * Sémantique EXCLUSIVE : la première branche dont le `when` matche gagne, la
 * branche sans `when` sert de dernier recours et s'écrit en dernier.
 * → `pickFirstMatch()`
 */
export const hotspotBranchSchema = z.strictObject({
	when: conditionSchema.optional(),
	effects: z.array(effectSchema).min(1),
});
export type HotspotBranch = z.infer<typeof hotspotBranchSchema>;

export const hotspotSchema = z.strictObject({
	id: z.string().min(1),
	label: z.string().min(1),
	/**
	 * Curseur au survol : il sélectionne un visuel côté front, donc champ libre
	 * — ajouter un curseur ne doit pas demander de migration. Seul `talk` est
	 * utilisé aujourd'hui, l'absence valant « examiner ».
	 */
	cursor: z.string().min(1).optional(),
	area: hotspotAreaSchema,
	branches: z.array(hotspotBranchSchema).min(1),
});
export type Hotspot = z.infer<typeof hotspotSchema>;

/**
 * Variante de fond, même sémantique EXCLUSIVE que les branches de hotspot.
 *
 * Un personnage optionnellement présent dans une scène se rend par une planche
 * de fond dédiée, pas par un sprite superposé : un sprite ne sait pas se
 * placer derrière un élément de décor.
 */
export const sceneBackgroundBranchSchema = z.strictObject({
	when: conditionSchema.optional(),
	image: z.url(),
});
export type SceneBackgroundBranch = z.infer<typeof sceneBackgroundBranchSchema>;

export const sceneSchema = z.strictObject({
	id: z.string().min(1),
	name: z.string().min(1),
	/** Soit un fond fixe, soit des variantes conditionnelles. */
	background: z.union([z.url(), z.array(sceneBackgroundBranchSchema).min(1)]),
	intro: z.string().min(1),
	/** Absent = scène disponible dès l'acceptation de l'enquête. */
	unlockWhen: conditionSchema.optional(),
	/** Texte affiché au déblocage. N'a de sens qu'avec `unlockWhen`. */
	unlockText: z.string().min(1).optional(),
	hotspots: z.array(hotspotSchema).min(1),
});
export type Scene = z.infer<typeof sceneSchema>;

/**
 * Sémantique ADDITIVE : toutes les options dont le `when` matche s'affichent
 * en même temps, une option sans `when` s'affiche toujours.
 * → `filterAllMatches()`
 *
 * Une option mène soit à un autre nœud (`goto`), soit à la sortie du dialogue
 * (`end: true`) — jamais les deux, d'où l'union plutôt qu'un `goto` optionnel
 * qu'on oublierait de remplir.
 */
export const dialogueOptionSchema = z.union([
	z.strictObject({
		text: z.string().min(1),
		when: conditionSchema.optional(),
		goto: z.string().min(1),
	}),
	z.strictObject({
		text: z.string().min(1),
		when: conditionSchema.optional(),
		end: z.literal(true),
	}),
]);
export type DialogueOption = z.infer<typeof dialogueOptionSchema>;

export const dialogueNodeSchema = z.strictObject({
	text: z.string().min(1),
	/** Joués à l'entrée du nœud : c'est là que se posent les flags. */
	effects: z.array(effectSchema).optional(),
	options: z.array(dialogueOptionSchema).min(1),
});
export type DialogueNode = z.infer<typeof dialogueNodeSchema>;

export const dialogueSchema = z.strictObject({
	characterId: z.string().min(1),
	start: z.string().min(1),
	nodes: z.record(z.string().min(1), dialogueNodeSchema),
});
export type Dialogue = z.infer<typeof dialogueSchema>;

export const clueSchema = z.strictObject({
	id: z.string().min(1),
	label: z.string().min(1),
	description: z.string().min(1),
});
export type Clue = z.infer<typeof clueSchema>;

/** Objet d'inventaire. Un indice peut exister sans objet, et l'inverse. */
export const caseItemSchema = z.strictObject({
	id: z.string().min(1),
	label: z.string().min(1),
	image: z.url(),
	description: z.string().min(1),
});
export type CaseItem = z.infer<typeof caseItemSchema>;

export const caseCharacterSchema = z.strictObject({
	id: z.string().min(1),
	name: z.string().min(1),
	role: z.string().min(1),
	portrait: z.url(),
});
export type CaseCharacter = z.infer<typeof caseCharacterSchema>;

/** Le mail qui propose l'enquête dans la boîte du bureau. */
export const briefingSchema = z.strictObject({
	from: z.email(),
	senderName: z.string().min(1),
	subject: z.string().min(1),
	body: z.string().min(1),
});
export type Briefing = z.infer<typeof briefingSchema>;

export const resolutionQuestionSchema = z.strictObject({
	id: resolutionQuestionIdSchema,
	prompt: z.string().min(1),
	options: z
		.array(z.strictObject({ id: z.string().min(1), label: z.string().min(1) }))
		.min(2),
});
export type ResolutionQuestion = z.infer<typeof resolutionQuestionSchema>;

export const resolutionSchema = z.strictObject({
	/** Condition d'ouverture de la résolution, évaluée sur l'état de partie. */
	unlockWhen: conditionSchema,
	lockedText: z.string().min(1),
	intro: z.string().min(1),
	questions: z.array(resolutionQuestionSchema).min(1),
});
export type Resolution = z.infer<typeof resolutionSchema>;

export const caseContentSchema = z.strictObject({
	startScene: z.string().min(1),
	briefing: briefingSchema,
	clues: z.array(clueSchema).min(1),
	items: z.array(caseItemSchema),
	characters: z.array(caseCharacterSchema),
	scenes: z.array(sceneSchema).min(1),
	/** Clé = id de dialogue, celui que vise l'effet `startDialogue`. */
	dialogues: z.record(z.string().min(1), dialogueSchema),
	resolution: resolutionSchema,
});
export type CaseContent = z.infer<typeof caseContentSchema>;

export const caseMetaSchema = z.strictObject({
	slug: z
		.string()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug en kebab-case ascii attendu"),
	title: z.string().min(1),
	description: z.string().min(1),
	coverImage: z.url(),
	difficulty: z.number().int().positive(),
	/** Rang d'apparition dans la boîte mail du hub. */
	order: z.number().int().positive(),
	/**
	 * Slug de l'enquête à avoir résolue avant que celle-ci n'arrive ; `null`
	 * pour les enquêtes disponibles d'emblée.
	 */
	unlockRequirement: z.string().min(1).nullable(),
	isPublished: z.boolean(),
	/** Version du contenu narratif, indépendante de `schemaVersion`. */
	version: z.number().int().positive(),
});
export type CaseMeta = z.infer<typeof caseMetaSchema>;

/**
 * Une fin possible.
 *
 * `score` = nombre de bonnes réponses (0 à 3) ; il filtre les fins candidates
 * AVANT que `matchAnswers` ne départage. `matchAnswers` absent = catch-all du
 * score, donc à écrire en dernier parmi les fins de même score.
 * → `pickEnding()`
 */
export const endingSchema = z.strictObject({
	score: z.number().int().min(0).max(3),
	matchAnswers: matchAnswersSchema.optional(),
	title: z.string().min(1),
	text: z.string().min(1),
});
export type Ending = z.infer<typeof endingSchema>;

export const solutionSchema = z.strictObject({
	answers: resolutionAnswersSchema,
	endings: z.array(endingSchema).min(1),
});
export type Solution = z.infer<typeof solutionSchema>;

export const caseFileSchema = z.strictObject({
	/**
	 * Figé à 1 : une évolution incompatible du format se signale ici et se
	 * traite par une migration explicite du contenu, plutôt que par un schéma
	 * permissif qui accepterait les deux formes.
	 */
	schemaVersion: z.literal(1),
	case: caseMetaSchema,
	content: caseContentSchema,
	solution: solutionSchema,
});
export type CaseFile = z.infer<typeof caseFileSchema>;

/** Valide un JSON d'enquête ; lève une `ZodError` détaillée si le format dévie. */
export function parseCaseFile(data: unknown): CaseFile {
	return caseFileSchema.parse(data);
}
