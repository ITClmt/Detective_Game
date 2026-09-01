<script setup lang="ts">
import type { Hotspot } from "@repo/shared";
import {
	applyEffects,
	pickFirstMatch,
	refreshUnlockedScenes,
	resolveBackground,
} from "@repo/shared/game/engine";
import type { PlayerState } from "@repo/shared/game/state";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import DialogueOverlay from "@/components/scene/DialogueOverlay.vue";
import ExamineOverlay from "@/components/scene/ExamineOverlay.vue";
import BaseHotspot from "@/components/ui/BaseHotspot.vue";
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

function handleHotspotClick(hotspot: Hotspot) {
	if (!state.value || !caseFile.value) return;
	if (activeDialogue.value || examineText.value) return;

	const branch = pickFirstMatch(hotspot.branches, state.value);
	if (!branch) return;

	const next: PlayerState = applyEffects(state.value, branch.effects);
	const { state: refreshed } = refreshUnlockedScenes(
		caseFile.value.content.scenes,
		next,
	);

	state.value = refreshed;
	saveProgress(refreshed);
	for (const effect of branch.effects) {
		if ("showText" in effect) examineText.value = effect.showText;
		if ("startDialogue" in effect)
			activeDialogueId.value = effect.startDialogue;
	}
}
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
				@click="handleHotspotClick(hotspot)"
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
				@close="activeDialogueId = null"
			/>
		</div>
	</main>
</template>
