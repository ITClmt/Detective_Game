<script setup lang="ts">
import type { Effect, Hotspot } from "@repo/shared";
import {
	applyEffects,
	isSceneUnlocked,
	pickFirstMatch,
	refreshUnlockedScenes,
	resolveBackground,
} from "@repo/shared/game/engine";
import type { PlayerState } from "@repo/shared/game/state";
import type { Interaction } from "@repo/shared/schemas/effect.schema";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import DialogueOverlay from "@/components/scene/DialogueOverlay.vue";
import ExamineOverlay from "@/components/scene/ExamineOverlay.vue";
import InteractionOverlay from "@/components/scene/InteractionOverlay.vue";
import InventoryModal from "@/components/scene/InventoryModal.vue";
import SceneMap from "@/components/scene/SceneMap.vue";
import BaseHotspot from "@/components/ui/BaseHotspot.vue";
import HotspotDebugOverlay from "@/components/ui/HotspotDebugOverlay.vue";
import { useHotspotDebug } from "@/composables/useHotspotDebug";
import {
	useCaseBySlugQuery,
	useCaseProgressQuery,
	useSaveProgressMutation,
} from "@/queries/cases.queries";

const route = useRoute();
const slug = route.params.slug as string;

const { data: caseFile, isLoading: caseLoading } = useCaseBySlugQuery(slug);
const { data: progress, isLoading: progressLoading } =
	useCaseProgressQuery(slug);
const { mutate: saveProgress } = useSaveProgressMutation(slug);

const state = ref<PlayerState>();
const examineText = ref<string | null>(null);
const activeDialogueId = ref<string | null>(null);
const activeInteraction = ref<Interaction | null>(null);

const activeDialogue = computed(() =>
	activeDialogueId.value
		? caseFile.value?.content.dialogues[activeDialogueId.value]
		: undefined,
);

const activeCharacter = computed(() =>
	caseFile.value?.content.characters.find(
		(character) => character.id === activeDialogue.value?.characterId,
	),
);

watch(progress, (value) => {
	if (value && !state.value) state.value = value.state;
});

const scene = computed(() => {
	if (!caseFile.value || !state.value) return undefined;
	return caseFile.value.content.scenes.find(
		(candidate) => candidate.id === state.value?.currentSceneId,
	);
});

const background = computed(() => {
	if (!scene.value || !state.value) return undefined;
	return resolveBackground(scene.value, state.value);
});

const unlockedScenes = computed(() => {
	if (!caseFile.value || !state.value) return [];
	const currentState = state.value;
	return caseFile.value.content.scenes.filter((candidate) =>
		isSceneUnlocked(candidate, currentState),
	);
});

const ownedItems = computed(() => {
	if (!caseFile.value || !state.value) return [];
	const currentState = state.value;
	return caseFile.value.content.items.filter((item) =>
		currentState.inventory.includes(item.id),
	);
});

function commitState(next: PlayerState) {
	if (!caseFile.value) return;

	const { state: refreshed } = refreshUnlockedScenes(
		caseFile.value.content.scenes,
		next,
	);

	state.value = refreshed;
	saveProgress(refreshed);
}

function handleHotspotClick(hotspot: Hotspot) {
	if (!state.value || !caseFile.value) return;
	if (activeDialogue.value || examineText.value) return;

	const branch = pickFirstMatch(hotspot.branches, state.value);
	if (!branch) return;

	commitState(applyEffects(state.value, branch.effects));

	for (const effect of branch.effects) {
		if ("showText" in effect) examineText.value = effect.showText;
		if ("startDialogue" in effect)
			activeDialogueId.value = effect.startDialogue;
		if ("interaction" in effect) activeInteraction.value = effect.interaction;
	}
}

function handleDialogueClose(finalState: PlayerState) {
	activeDialogueId.value = null;
	commitState(finalState);
}

function handleInteractionResolve(payload: {
	success: boolean;
	effects: Effect[];
}) {
	if (!state.value) return;

	commitState(applyEffects(state.value, payload.effects));

	for (const effect of payload.effects) {
		if ("showText" in effect) examineText.value = effect.showText;
	}

	if (payload.success) activeInteraction.value = null;
}

const showMap = ref(false);
const showInventory = ref(false);

function handleSceneSelect(sceneId: string) {
	if (!state.value) return;
	showMap.value = false;
	commitState({ ...state.value, currentSceneId: sceneId });
}

const { debugMode } = useHotspotDebug();
</script>

<template>
	<main class="flex h-screen w-screen items-center justify-center p-6 md:p-10">
		<p
			v-if="caseLoading || progressLoading || !scene || !state"
			class="font-mono text-body-sm text-content-faint"
		>
			Chargement...
		</p>

		<div
			v-else
			class="relative overflow-hidden border border-border bg-surface-raised shadow-frame"
		>
			<img
				:src="background"
				:alt="scene.name"
				class="block h-auto w-auto max-h-[calc(100dvh-2rem)] max-w-[calc(100dvw-5rem)] object-contain"
			>

			<BaseHotspot
				v-for="hotspot in scene.hotspots"
				:key="hotspot.id"
				:label="hotspot.label"
				:area="hotspot.area"
				hover
				@click="handleHotspotClick(hotspot)"
			/>

			<InteractionOverlay
				v-if="activeInteraction"
				:interaction="activeInteraction"
				@resolve="handleInteractionResolve"
				@cancel="activeInteraction = null"
			/>

			<ExamineOverlay
				v-if="examineText && !activeDialogue"
				:text="examineText"
				@close="examineText = null"
			/>

			<DialogueOverlay
				v-if="activeDialogue"
				:dialogue="activeDialogue"
				:state="state"
				:character="activeCharacter"
				@close="handleDialogueClose"
			/>

			<div class="absolute bottom-3 left-3 z-10 flex gap-2">
				<button
					type="button"
					class="cursor-pointer border border-accent bg-surface-raised px-3 py-2 font-mono text-label tracking-mono-wide text-accent transition-colors duration-150 hover:bg-accent hover:text-accent-contrast"
					@click="showMap = true"
				>
					CARTE
				</button>
				<button
					type="button"
					class="cursor-pointer border border-accent bg-surface-raised px-3 py-2 font-mono text-label tracking-mono-wide text-accent transition-colors duration-150 hover:bg-accent hover:text-accent-contrast"
					@click="showInventory = true"
				>
					INVENTAIRE
				</button>
			</div>

			<SceneMap
				v-if="showMap"
				:scenes="unlockedScenes"
				:current-scene-id="state.currentSceneId"
				@select="handleSceneSelect"
				@close="showMap = false"
			/>

			<InventoryModal
				v-if="showInventory"
				:items="ownedItems"
				@close="showInventory = false"
			/>

			<div
				class="pointer-events-none absolute right-3 bottom-3 z-10 font-mono text-micro text-content-ghost"
			>
				D = debug hotspots ({{ debugMode ? "ON" : "off" }})
			</div>
			<HotspotDebugOverlay v-if="debugMode" />
		</div>
	</main>
</template>
