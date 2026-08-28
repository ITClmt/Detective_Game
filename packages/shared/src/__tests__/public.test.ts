import { describe, expect, it } from "vitest";
import { stripSolution } from "../game/public";
import { verdier } from "./fixture";

describe("stripSolution", () => {
	it("retire `solution` et rien d'autre", () => {
		const preview = stripSolution(verdier);

		expect(Object.hasOwn(preview, "solution")).toBe(false);
		expect(preview.case).toStrictEqual(verdier.case);
		expect(preview.content).toStrictEqual(verdier.content);
	});

	it("ne mute pas l'enquête d'origine", () => {
		stripSolution(verdier);

		expect(verdier.solution.answers.culprit).toBe("camille");
	});
});
