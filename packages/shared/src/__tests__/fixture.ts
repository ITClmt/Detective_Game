import { applyEffects, filterAllMatches, pickFirstMatch } from "../game/engine";
import type { PlayerState } from "../game/state";
import type {
	CaseFile,
	Dialogue,
	DialogueNode,
	DialogueOption,
	Hotspot,
	Scene,
} from "../schemas/case.schema";
import { parseCaseFile } from "../schemas/case.schema";
import type { Effect } from "../schemas/effect.schema";
import { readVerdierJson } from "./verdier-json";

/**
 * `content/verdier.json` sert de fixture principale : c'est le seul contenu
 * complet écrit à la main, et le seul qui exerce réellement les trois
 * sémantiques d'évaluation. Tester contre lui plutôt que contre des objets
 * fabriqués évite d'écrire des tests qui valident une idée du format au lieu
 * du format.
 */
export const verdier: CaseFile = parseCaseFile(readVerdierJson());

export function findScene(sceneId: string): Scene {
	const scene = verdier.content.scenes.find((entry) => entry.id === sceneId);
	if (!scene) throw new Error(`Scène introuvable dans la fixture : ${sceneId}`);
	return scene;
}

export function findHotspot(sceneId: string, hotspotId: string): Hotspot {
	const hotspot = findScene(sceneId).hotspots.find(
		(entry) => entry.id === hotspotId,
	);
	if (!hotspot) {
		throw new Error(`Hotspot introuvable : ${sceneId}/${hotspotId}`);
	}
	return hotspot;
}

export function findDialogue(dialogueId: string): Dialogue {
	const dialogue = verdier.content.dialogues[dialogueId];
	if (!dialogue) throw new Error(`Dialogue introuvable : ${dialogueId}`);
	return dialogue;
}

export function findNode(dialogueId: string, nodeId: string): DialogueNode {
	const node = findDialogue(dialogueId).nodes[nodeId];
	if (!node) throw new Error(`Nœud introuvable : ${dialogueId}/${nodeId}`);
	return node;
}

/**
 * Clic sur un hotspot : sémantique EXCLUSIVE sur les branches, puis
 * application des effets de la branche retenue.
 */
export function clickHotspot(
	state: PlayerState,
	sceneId: string,
	hotspotId: string,
): { state: PlayerState; effects: Effect[] } {
	const hotspot = findHotspot(sceneId, hotspotId);
	const branch = pickFirstMatch(hotspot.branches, state);
	if (!branch) {
		throw new Error(`Aucune branche ne matche pour ${sceneId}/${hotspotId}`);
	}
	return {
		state: applyEffects(state, branch.effects),
		effects: branch.effects,
	};
}

/** Entrée dans un nœud de dialogue : les effets du nœud sont joués une fois. */
export function enterNode(
	state: PlayerState,
	dialogueId: string,
	nodeId: string,
): PlayerState {
	const node = findNode(dialogueId, nodeId);
	return applyEffects(state, node.effects ?? []);
}

/** Options affichées : sémantique ADDITIVE. */
export function visibleOptions(
	state: PlayerState,
	dialogueId: string,
	nodeId: string,
): DialogueOption[] {
	return filterAllMatches(findNode(dialogueId, nodeId).options, state);
}

export function optionTexts(options: DialogueOption[]): string[] {
	return options.map((option) => option.text);
}

/**
 * Suit l'option dont le `goto` vise `nodeId` et applique les effets du nœud
 * atteint. Échoue si l'option n'est pas visible dans l'état courant : c'est le
 * point qu'on veut vraiment tester dans un parcours.
 */
export function chooseGoto(
	state: PlayerState,
	dialogueId: string,
	fromNodeId: string,
	toNodeId: string,
): PlayerState {
	const option = visibleOptions(state, dialogueId, fromNodeId).find(
		(candidate) => "goto" in candidate && candidate.goto === toNodeId,
	);
	if (!option) {
		throw new Error(
			`Option vers « ${toNodeId} » non visible depuis ${dialogueId}/${fromNodeId}`,
		);
	}
	return enterNode(state, dialogueId, toNodeId);
}
