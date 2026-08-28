import { describe, expect, it } from "vitest";
import {
	caseFileSchema,
	dialogueOptionSchema,
	hotspotSchema,
} from "../schemas/case.schema";
import {
	conditionSchema,
	matchAnswersSchema,
} from "../schemas/condition.schema";
import { effectSchema } from "../schemas/effect.schema";
import { readVerdierJson } from "./verdier-json";

describe("caseFileSchema", () => {
	it("valide content/verdier.json sans écart", () => {
		const result = caseFileSchema.safeParse(readVerdierJson());

		// On imprime les écarts plutôt qu'un simple `false` : sur un JSON de mille
		// lignes, l'assertion nue ne dit pas où regarder.
		expect(
			result.success ? [] : result.error.issues.map(formatIssue),
		).toStrictEqual([]);
	});

	it("refuse une clé inconnue (faute de frappe d'auteur)", () => {
		const hotspot = {
			id: "hs_test",
			label: "Test",
			area: { x: 0, y: 0, w: 10, h: 10 },
			branch: [{ effects: [{ showText: "..." }] }], // « branch » au lieu de « branches »
		};

		expect(hotspotSchema.safeParse(hotspot).success).toBe(false);
	});

	it("refuse un schemaVersion autre que 1", () => {
		const bumped = { ...(readVerdierJson() as object), schemaVersion: 2 };

		expect(caseFileSchema.safeParse(bumped).success).toBe(false);
	});

	it("refuse une option de dialogue qui est à la fois goto et end", () => {
		expect(
			dialogueOptionSchema.safeParse({ text: "…", goto: "accueil" }).success,
		).toBe(true);
		expect(
			dialogueOptionSchema.safeParse({ text: "…", end: true }).success,
		).toBe(true);
		expect(
			dialogueOptionSchema.safeParse({ text: "…", goto: "accueil", end: true })
				.success,
		).toBe(false);
	});
});

describe("conditionSchema", () => {
	it("accepte les sept opérateurs, `any` et `not` compris", () => {
		const conditions = [
			{ hasClue: "clue_verre_vin" },
			{ hasFlag: "temoignage_sofia" },
			{ hasItem: "item_stylo_insuline" },
			{ clueCount: { gte: 10 } },
			{ all: [{ hasClue: "a" }, { hasFlag: "b" }] },
			{ any: [{ hasClue: "a" }, { hasClue: "b" }] },
			{ not: { hasFlag: "b" } },
			{ not: { any: [{ hasClue: "a" }, { all: [{ hasItem: "b" }] }] } },
		];

		for (const condition of conditions) {
			expect(conditionSchema.safeParse(condition).success).toBe(true);
		}
	});

	it("refuse une condition à deux opérateurs — l'ambiguïté ne doit pas exister", () => {
		expect(
			conditionSchema.safeParse({ hasClue: "a", hasFlag: "b" }).success,
		).toBe(false);
	});

	it("refuse un opérateur inconnu", () => {
		expect(conditionSchema.safeParse({ hasEvidence: "a" }).success).toBe(false);
	});
});

describe("effectSchema", () => {
	it("refuse un effet portant deux verbes", () => {
		expect(
			effectSchema.safeParse({ showText: "…", addClue: "clue_x" }).success,
		).toBe(false);
	});

	it("refuse un verbe inconnu plutôt que de l'ignorer", () => {
		expect(effectSchema.safeParse({ playSound: "boom" }).success).toBe(false);
	});

	it("accepte une interaction imbriquée dans onSuccess", () => {
		const nested = {
			interaction: {
				action: "input",
				prompt: "Code ?",
				params: { kind: "number", length: 4, answer: "1403" },
				onSuccess: [
					{
						interaction: {
							action: "input",
							prompt: "Encore ?",
							params: { answer: "0000" },
							onSuccess: [{ addClue: "clue_x" }],
						},
					},
				],
				onFailure: [{ showText: "Raté." }],
			},
		};

		expect(effectSchema.safeParse(nested).success).toBe(true);
	});
});

describe("matchAnswersSchema", () => {
	it("accepte un motif partiel", () => {
		expect(matchAnswersSchema.safeParse({ culprit: "camille" }).success).toBe(
			true,
		);
	});

	it("refuse un motif vide (un catch-all s'écrit sans matchAnswers)", () => {
		expect(matchAnswersSchema.safeParse({}).success).toBe(false);
	});

	it("refuse une clé hors des trois questions de résolution", () => {
		expect(matchAnswersSchema.safeParse({ weapon: "insuline" }).success).toBe(
			false,
		);
	});
});

function formatIssue(issue: { path: PropertyKey[]; message: string }): string {
	return `${issue.path.join(".")} — ${issue.message}`;
}
