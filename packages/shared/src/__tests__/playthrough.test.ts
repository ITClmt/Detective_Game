import { describe, expect, it } from "vitest";
import {
	applyEffects,
	evaluateCondition,
	pickEnding,
	pickFirstMatch,
	resolveBackground,
} from "../game/engine";
import { createPlayerState, type PlayerState } from "../game/state";
import type { ResolutionAnswers } from "../schemas/condition.schema";
import type { Effect, Interaction } from "../schemas/effect.schema";
import {
	chooseGoto,
	clickHotspot,
	enterNode,
	findHotspot,
	findScene,
	optionTexts,
	verdier,
	visibleOptions,
} from "./fixture";

/**
 * Parcours complet de l'affaire Verdier, de l'appartement à la résolution 3/3,
 * en ne passant que par les fonctions du moteur.
 *
 * C'est le test qui a le plus de valeur : il fait travailler les trois
 * sémantiques dans le même enchaînement (branches exclusives, options
 * additives, sélection de fin par réponses) et il échoue si le contenu
 * devient injouable — un `when` qui ne s'ouvre jamais, un indice qu'aucun
 * hotspot ne donne, un déblocage devenu inatteignable.
 */
describe("parcours complet — affaire Verdier", () => {
	it("mène à la résolution 3/3 et à la fin « Dossier clos »", () => {
		let state = createPlayerState(verdier.content.startScene);
		expect(state.currentSceneId).toBe("duplex");

		// ---------------------------------------------------------------------
		// Le duplex, avant de toucher au téléphone : Camille est encore là.
		// ---------------------------------------------------------------------
		for (const hotspotId of [
			"hs_verre_vin",
			"hs_table_de_nuit",
			"hs_poubelle_sdb",
			"hs_courrier_console",
			"hs_agenda_mural",
		]) {
			state = clickHotspot(state, "duplex", hotspotId).state;
		}

		expect(state.clues).toStrictEqual([
			"clue_verre_vin",
			"clue_somniferes_ordonnance",
			"clue_capuchon_aiguille",
			"clue_avenant_assurance",
			"clue_agenda_rdv",
		]);
		expect(state.inventory).toStrictEqual([
			"item_somniferes_ordonnance",
			"item_capuchon_aiguille",
			"item_avenant_assurance",
		]);

		// ---------------------------------------------------------------------
		// Dialogue avec Camille : les options s'ajoutent au fil des indices.
		// ---------------------------------------------------------------------
		const talk = clickHotspot(state, "duplex", "hs_parler_camille");
		expect(talk.effects).toStrictEqual([{ startDialogue: "camille_duplex" }]);
		state = talk.state;

		state = enterNode(state, "camille_duplex", "accueil");
		const opening = optionTexts(
			visibleOptions(state, "camille_duplex", "accueil"),
		);
		expect(opening).toContain(
			"J'ai trouvé ceci dans la poubelle de votre salle de bain.",
		);
		expect(opening).toContain("Parlons de cet avenant d'assurance-vie.");
		// Pas encore : Camille n'a pas menti sur le diabète.
		expect(opening).not.toContain(
			"Son ordonnance ne mentionne aucun antidiabétique.",
		);

		state = chooseGoto(state, "camille_duplex", "accueil", "capuchon");
		expect(state.flags).toContain("camille_ment_diabete");

		state = chooseGoto(state, "camille_duplex", "capuchon", "capuchon_relance");
		state = chooseGoto(state, "camille_duplex", "capuchon_relance", "accueil");

		// Le mensonge posé, l'ordonnance déjà lue : l'option de contradiction
		// s'ajoute aux précédentes au lieu de les remplacer.
		const afterLie = optionTexts(
			visibleOptions(state, "camille_duplex", "accueil"),
		);
		expect(afterLie).toContain(
			"Son ordonnance ne mentionne aucun antidiabétique.",
		);
		expect(afterLie).toContain(
			"J'ai trouvé ceci dans la poubelle de votre salle de bain.",
		);
		expect(afterLie.length).toBe(opening.length + 1);

		state = chooseGoto(
			state,
			"camille_duplex",
			"accueil",
			"contradiction_diabete",
		);

		// ---------------------------------------------------------------------
		// Le téléphone : une interaction, pas un simple clic.
		// ---------------------------------------------------------------------
		const phone = clickHotspot(state, "duplex", "hs_telephone");
		const interaction = interactionOf(phone.effects);
		expect(interaction.action).toBe("input");
		// La réponse vient du contenu serveur ; le code se lit sur l'agenda mural
		// (« 14 mars — anniv. N. »).
		expect(interaction.params.answer).toBe("1403");

		const failed = applyEffects(phone.state, interaction.onFailure ?? []);
		expect(failed.clues).not.toContain("clue_messages_telephone");

		state = applyEffects(phone.state, interaction.onSuccess);
		expect(state.clues).toContain("clue_messages_telephone");

		// ---------------------------------------------------------------------
		// Conséquences du même indice : la scène change de fond, Camille n'est
		// plus au duplex, l'hôpital s'ouvre.
		// ---------------------------------------------------------------------
		const duplex = findScene("duplex");
		expect(resolveBackground(duplex, state)).toBe(
			"https://assets.triviani.local/verdier/scenes/duplex_vide.webp",
		);

		const camilleGone = clickHotspot(state, "duplex", "hs_parler_camille");
		expect(camilleGone.effects[0]).not.toHaveProperty("startDialogue");

		const hopital = findScene("hopital");
		if (!hopital.unlockWhen)
			throw new Error("L'hôpital devrait être verrouillé");
		expect(evaluateCondition(hopital.unlockWhen, state)).toBe(true);
		// `applyEffects` ne débloque pas les scènes : le déblocage se calcule sur
		// `unlockWhen` et se mémorise dans l'état (cf. PlayerState.unlockedScenes).
		state = unlock(state, "hopital");

		// ---------------------------------------------------------------------
		// Halo Studio.
		// ---------------------------------------------------------------------
		for (const hotspotId of [
			"hs_ordinateur_nicolas",
			"hs_classeur_comptable",
			"hs_bureau_yann",
			"hs_casier_sofia",
			"hs_interphone",
		]) {
			state = clickHotspot(state, "studio", hotspotId).state;
		}

		expect(state.flags).toContain("sait_dettes_yann");
		expect(state.clues).toHaveLength(10);

		// Sofia : son témoignage n'arrive qu'après l'interphone ET le
		// licenciement — deux indices, deux options qui s'empilent.
		state = clickHotspot(state, "studio", "hs_parler_sofia").state;
		state = enterNode(state, "sofia_studio", "accueil");
		state = chooseGoto(state, "sofia_studio", "accueil", "interphone");
		state = chooseGoto(state, "sofia_studio", "interphone", "temoignage");
		expect(state.flags).toContain("temoignage_sofia");

		// Il manque encore le registre : la résolution reste fermée.
		expect(
			evaluateCondition(verdier.content.resolution.unlockWhen, state),
		).toBe(false);

		// ---------------------------------------------------------------------
		// Hôpital Saint-Éloi.
		// ---------------------------------------------------------------------
		for (const hotspotId of [
			"hs_planning_service",
			"hs_registre_pharmacie",
			"hs_vestiaire_camille",
		]) {
			state = clickHotspot(state, "hopital", hotspotId).state;
		}

		expect(state.clues).toHaveLength(13);

		// Revenir sur le registre avec les deux indices : la branche `all` passe
		// devant la branche à un seul indice, qui la suit dans le tableau.
		const revisit = clickHotspot(state, "hopital", "hs_registre_pharmacie");
		expect(revisit.effects[0]).toStrictEqual(
			findHotspot("hopital", "hs_registre_pharmacie").branches[0]?.effects[0],
		);

		// La confrontation finale est ouverte.
		const confront = pickFirstMatch(
			findHotspot("hopital", "hs_confronter_camille").branches,
			state,
		);
		expect(confront?.effects).toStrictEqual([
			{ startDialogue: "camille_confrontation" },
		]);

		// ---------------------------------------------------------------------
		// Résolution.
		// ---------------------------------------------------------------------
		expect(
			evaluateCondition(verdier.content.resolution.unlockWhen, state),
		).toBe(true);

		const answers: ResolutionAnswers = {
			culprit: "camille",
			motive: "denonciation",
			method: "insuline",
		};
		const outcome = pickEnding(verdier.solution, answers);

		expect(outcome?.score).toBe(3);
		expect(outcome?.ending.title).toBe("Dossier clos");
	});

	/**
	 * Le contrôle croisé que Zod ne peut pas faire : chaque bonne réponse doit
	 * exister comme option de la question de même id, sinon le 3/3 est
	 * inatteignable sans qu'aucune validation ne le signale.
	 */
	it("a des réponses de solution qui existent dans les questions", () => {
		for (const question of verdier.content.resolution.questions) {
			const optionIds = question.options.map((option) => option.id);
			expect(optionIds).toContain(verdier.solution.answers[question.id]);
		}

		const questionIds = verdier.content.resolution.questions.map((q) => q.id);
		expect(questionIds).toStrictEqual(["culprit", "motive", "method"]);
	});
});

function interactionOf(effects: Effect[]): Interaction {
	const effect = effects.find((candidate) => "interaction" in candidate);
	if (!effect || !("interaction" in effect)) {
		throw new Error("Aucune interaction dans ces effets");
	}
	return effect.interaction;
}

function unlock(state: PlayerState, sceneId: string): PlayerState {
	return {
		...state,
		unlockedScenes: [...state.unlockedScenes, sceneId],
		currentSceneId: sceneId,
	};
}
