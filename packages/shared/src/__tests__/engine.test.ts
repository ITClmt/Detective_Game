import { describe, expect, it } from "vitest";
import {
	applyEffects,
	evaluateCondition,
	filterAllMatches,
	matchAnswers,
	pickEnding,
	pickFirstMatch,
	resolveBackground,
	scoreAnswers,
} from "../game/engine";
import { createPlayerState, type PlayerState } from "../game/state";
import type { Condition, ResolutionAnswers } from "../schemas/condition.schema";
import type { Effect } from "../schemas/effect.schema";
import {
	findHotspot,
	findScene,
	optionTexts,
	verdier,
	visibleOptions,
} from "./fixture";

function stateWith(partial: Partial<PlayerState>): PlayerState {
	return { ...createPlayerState("duplex"), ...partial };
}

describe("evaluateCondition", () => {
	const state = stateWith({
		clues: ["clue_a", "clue_b", "clue_c"],
		flags: ["flag_a"],
		inventory: ["item_a"],
	});

	it("évalue les opérateurs feuilles", () => {
		expect(evaluateCondition({ hasClue: "clue_a" }, state)).toBe(true);
		expect(evaluateCondition({ hasClue: "clue_z" }, state)).toBe(false);
		expect(evaluateCondition({ hasFlag: "flag_a" }, state)).toBe(true);
		expect(evaluateCondition({ hasFlag: "flag_z" }, state)).toBe(false);
		expect(evaluateCondition({ hasItem: "item_a" }, state)).toBe(true);
		expect(evaluateCondition({ hasItem: "item_z" }, state)).toBe(false);
	});

	it("compare clueCount.gte au nombre d'indices, bornes comprises", () => {
		expect(evaluateCondition({ clueCount: { gte: 2 } }, state)).toBe(true);
		expect(evaluateCondition({ clueCount: { gte: 3 } }, state)).toBe(true);
		expect(evaluateCondition({ clueCount: { gte: 4 } }, state)).toBe(false);
	});

	it("combine all / any / not, y compris imbriqués", () => {
		expect(
			evaluateCondition(
				{ all: [{ hasClue: "clue_a" }, { hasFlag: "flag_a" }] },
				state,
			),
		).toBe(true);
		expect(
			evaluateCondition(
				{ all: [{ hasClue: "clue_a" }, { hasFlag: "flag_z" }] },
				state,
			),
		).toBe(false);
		expect(
			evaluateCondition(
				{ any: [{ hasClue: "clue_z" }, { hasFlag: "flag_a" }] },
				state,
			),
		).toBe(true);
		expect(
			evaluateCondition(
				{ any: [{ hasClue: "clue_z" }, { hasFlag: "flag_z" }] },
				state,
			),
		).toBe(false);
		expect(evaluateCondition({ not: { hasClue: "clue_z" } }, state)).toBe(true);
		expect(
			evaluateCondition(
				{ not: { any: [{ hasClue: "clue_a" }, { hasItem: "item_z" }] } },
				state,
			),
		).toBe(false);
	});

	it("ne lit jamais les réponses de résolution : elles ne sont pas dans l'état", () => {
		// `culprit` n'est pas un opérateur : la grammaire le refuse, et une
		// condition qui viserait les réponses ne peut donc pas exister.
		const bogus = { culprit: "camille" } as unknown as Condition;

		expect(() => evaluateCondition(bogus, state)).toThrow();
	});
});

describe("pickFirstMatch — sémantique EXCLUSIVE", () => {
	const list = [
		{ when: { hasClue: "clue_a" }, tag: "a" },
		{ when: { hasClue: "clue_b" }, tag: "b" },
		{ tag: "catch-all" },
	];

	it("retient la première entrée qui matche, dans l'ordre d'écriture", () => {
		const both = stateWith({ clues: ["clue_a", "clue_b"] });

		expect(pickFirstMatch(list, both)?.tag).toBe("a");
	});

	it("retombe sur l'entrée sans `when`", () => {
		expect(pickFirstMatch(list, stateWith({}))?.tag).toBe("catch-all");
	});

	it("renvoie undefined quand rien ne matche et qu'il n'y a pas de catch-all", () => {
		const conditional = [{ when: { hasClue: "clue_a" }, tag: "a" }];

		expect(pickFirstMatch(conditional, stateWith({}))).toBeUndefined();
	});

	it("n'ouvre la confrontation de Camille qu'avec planning + témoignage", () => {
		const hotspot = findHotspot("hopital", "hs_confronter_camille");
		const partial = stateWith({ clues: ["clue_planning_hospitalier"] });
		const complete = stateWith({
			clues: ["clue_planning_hospitalier"],
			flags: ["temoignage_laya"],
		});

		expect(
			pickFirstMatch(hotspot.branches, partial)?.effects[0],
		).not.toHaveProperty("startDialogue");
		expect(
			pickFirstMatch(hotspot.branches, complete)?.effects[0],
		).toStrictEqual({ startDialogue: "camille_confrontation" });
	});
});

describe("filterAllMatches — sémantique ADDITIVE", () => {
	it("affiche toutes les options qui matchent, sans doublon ni disparition", () => {
		// Le cas qui a servi de contre-exemple : sur `interphone`, l'option
		// conditionnelle s'ajoute à l'option inconditionnelle, elle ne la
		// remplace pas.
		const without = visibleOptions(stateWith({}), "laya_studio", "interphone");
		const with_ = visibleOptions(
			stateWith({ clues: ["clue_lettre_licenciement"] }),
			"laya_studio",
			"interphone",
		);

		expect(optionTexts(without)).toStrictEqual([
			"Je ne vous accuse de rien. Pour l'instant.",
		]);
		expect(optionTexts(with_)).toStrictEqual([
			"Je veux surtout savoir ce que vous avez vu.",
			"Je ne vous accuse de rien. Pour l'instant.",
		]);
	});

	it("renvoie un tableau vide quand rien ne matche", () => {
		const list = [{ when: { hasFlag: "absent" }, tag: "x" }];

		expect(filterAllMatches(list, stateWith({}))).toStrictEqual([]);
	});
});

describe("applyEffects", () => {
	const before = stateWith({ clues: ["clue_a"], flags: [], inventory: [] });

	it("ne mute pas l'état reçu et renvoie une nouvelle référence", () => {
		const after = applyEffects(before, [{ addClue: "clue_b" }]);

		expect(before.clues).toStrictEqual(["clue_a"]);
		expect(after).not.toBe(before);
		expect(after.clues).not.toBe(before.clues);
		expect(after.clues).toStrictEqual(["clue_a", "clue_b"]);
	});

	it("applique addClue / addItem / setFlag", () => {
		const after = applyEffects(before, [
			{ addClue: "clue_b" },
			{ addItem: "item_a" },
			{ setFlag: "flag_a" },
		]);

		expect(after.clues).toStrictEqual(["clue_a", "clue_b"]);
		expect(after.inventory).toStrictEqual(["item_a"]);
		expect(after.flags).toStrictEqual(["flag_a"]);
	});

	it("est idempotent : rejouer un effet ne duplique rien", () => {
		const once = applyEffects(before, [{ addClue: "clue_b" }]);
		const twice = applyEffects(once, [{ addClue: "clue_b" }]);

		expect(twice.clues).toStrictEqual(["clue_a", "clue_b"]);
	});

	it("laisse l'état intact sur showText, startDialogue et interaction", () => {
		const effects: Effect[] = [
			{ showText: "…" },
			{ startDialogue: "camille_duplex" },
			{
				interaction: {
					action: "input",
					prompt: "Code ?",
					params: { answer: "1403" },
					// Surtout pas appliqués d'avance : le joueur n'a rien tapé encore.
					onSuccess: [{ addClue: "clue_messages_telephone" }],
					onFailure: [{ showText: "Raté." }],
				},
			},
		];

		const after = applyEffects(before, effects);

		expect(after).toStrictEqual(before);
		expect(after).not.toBe(before);
	});
});

describe("matchAnswers — sémantique RÉPONSES", () => {
	const answers: ResolutionAnswers = {
		culprit: "camille",
		motive: "denonciation",
		method: "insuline",
	};

	it("ignore les clés absentes du motif", () => {
		expect(matchAnswers({ culprit: "camille" }, answers)).toBe(true);
		expect(matchAnswers({ culprit: "yann" }, answers)).toBe(false);
		expect(
			matchAnswers({ culprit: "camille", method: "poussee" }, answers),
		).toBe(false);
	});

	it("exige toutes les clés présentes", () => {
		expect(
			matchAnswers(
				{ culprit: "camille", motive: "denonciation", method: "insuline" },
				answers,
			),
		).toBe(true);
	});
});

describe("pickEnding", () => {
	const solution = verdier.solution;
	const right = solution.answers;

	it("compte les bonnes réponses", () => {
		expect(scoreAnswers(right, right)).toBe(3);
		expect(scoreAnswers(right, { ...right, method: "poussee" })).toBe(2);
		expect(
			scoreAnswers(right, {
				culprit: "yann",
				motive: "assurance",
				method: "objet",
			}),
		).toBe(0);
	});

	it("choisit la fin par score puis par matchAnswers", () => {
		const cases: Array<[ResolutionAnswers, string]> = [
			[right, "Dossier clos"],
			// 2/3 avec le bon coupable, et 2/3 sans : le score seul ne suffit pas
			// à trancher, d'où le second étage.
			[{ ...right, method: "poussee" }, "Dossier recevable"],
			[{ ...right, culprit: "yann" }, "Mauvaise cible"],
			[
				{ culprit: "camille", motive: "assurance", method: "poussee" },
				"Intuition seule",
			],
			[
				{ culprit: "laya", motive: "vengeance", method: "insuline" },
				"Affaire reclassée",
			],
			[
				{ culprit: "yann", motive: "assurance", method: "poussee" },
				"Erreur judiciaire",
			],
		];

		for (const [given, expected] of cases) {
			expect(pickEnding(solution, given)?.ending.title).toBe(expected);
		}
	});
});

describe("resolveBackground", () => {
	it("renvoie la chaîne telle quelle sur un fond fixe", () => {
		expect(resolveBackground(findScene("studio"), stateWith({}))).toBe(
			"https://assets.triviani.local/verdier/scenes/studio.webp",
		);
	});

	it("bascule sur la planche « duplex vide » quand Camille est partie", () => {
		const duplex = findScene("duplex");

		expect(resolveBackground(duplex, stateWith({}))).toBe(
			"https://assets.triviani.local/verdier/scenes/duplex.webp",
		);
		expect(
			resolveBackground(
				duplex,
				stateWith({ clues: ["clue_messages_telephone"] }),
			),
		).toBe("https://assets.triviani.local/verdier/scenes/duplex_vide.webp");
	});
});
