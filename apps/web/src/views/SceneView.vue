<script setup lang="ts">
import {
	applyEffects,
	evaluateCondition,
	pickFirstMatch,
	refreshUnlockedScenes,
	resolveBackground,
} from "@repo/shared/game/engine";
import type { PlayerState } from "@repo/shared/game/state";
import type { Hotspot, Scene } from "@repo/shared/schemas/case.schema";
import type { Effect, Interaction } from "@repo/shared/schemas/effect.schema";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import DialogueOverlay from "@/components/scene/DialogueOverlay.vue";
import ExamineOverlay from "@/components/scene/ExamineOverlay.vue";
import HotspotDebugOverlay from "@/components/scene/HotspotDebugOverlay.vue";
import InteractionOverlay from "@/components/scene/InteractionOverlay.vue";
import ResolutionModal from "@/components/scene/ResolutionModal.vue";
import SceneSwitcher from "@/components/scene/SceneSwitcher.vue";
import BaseHotspot from "@/components/ui/BaseHotspot.vue";
import {
	useCaseProgressQuery,
	useCaseQuery,
	useSaveProgressMutation,
} from "@/queries/case.queries";

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const { data: caseFile, isLoading: caseLoading } = useCaseQuery(slug);
const { data: initialProgress, isLoading: progressLoading } =
	useCaseProgressQuery(slug);
const { mutate: persistProgress } = useSaveProgressMutation(slug);

/**
 * Source de vérité locale une fois la partie chargée : les effets s'appliquent
 * tout de suite à l'écran, la sauvegarde vers l'API suit derrière sans
 * bloquer le clic suivant. Prototype uniquement — pas de gestion de conflit
 * si deux onglets jouent la même enquête en parallèle.
 */
const state = ref<PlayerState | undefined>(initialProgress.value);
watch(initialProgress, (value) => {
	if (value && !state.value) state.value = value;
});

const scene = computed<Scene | undefined>(() => {
	if (!caseFile.value || !state.value) return undefined;
	return caseFile.value.content.scenes.find(
		(candidate) => candidate.id === state.value?.currentSceneId,
	);
});

const background = computed(() => {
	if (!scene.value || !state.value) return undefined;
	return resolveBackground(scene.value, state.value);
});

const resolutionUnlocked = computed(() => {
	if (!state.value || !caseFile.value) return false;
	return evaluateCondition(
		caseFile.value.content.resolution.unlockWhen,
		state.value,
	);
});

// --- Toasts (scènes débloquées uniquement — éphémère, ambiant) -------------

const toasts = ref<{ id: number; text: string }[]>([]);
let nextToastId = 0;

function showToast(text: string) {
	const id = nextToastId++;
	toasts.value.push({ id, text });
	setTimeout(() => {
		toasts.value = toasts.value.filter((toast) => toast.id !== id);
	}, 6000);
}

/**
 * Texte d'examen (effet `showText`) : contrairement aux toasts, reste affiché
 * jusqu'à fermeture manuelle — même famille visuelle que DialogueOverlay.
 */
const examineText = ref<string | null>(null);

// --- Effets ----------------------------------------------------------------

function commitState(next: PlayerState) {
	if (!caseFile.value) return;

	const { state: refreshed, newlyUnlocked } = refreshUnlockedScenes(
		caseFile.value.content.scenes,
		next,
	);

	state.value = refreshed;
	persistProgress(refreshed);

	for (const unlockedScene of newlyUnlocked) {
		showToast(unlockedScene.unlockText ?? `Débloqué : ${unlockedScene.name}`);
	}
}

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
const dialogueOverlayRef = ref<{ localState: PlayerState } | null>(null);

const activeInteraction = ref<Interaction | null>(null);

function runEffects(effects: Effect[]) {
	if (!state.value) return;

	const dialogue = effects.find(
		(effect): effect is { startDialogue: string } => "startDialogue" in effect,
	);
	if (dialogue) {
		activeDialogueId.value = dialogue.startDialogue;
		return;
	}

	const interaction = effects.find(
		(effect): effect is { interaction: Interaction } => "interaction" in effect,
	);
	if (interaction) {
		activeInteraction.value = interaction.interaction;
		return;
	}

	const text = effects.find(
		(effect): effect is { showText: string } => "showText" in effect,
	);

	commitState(applyEffects(state.value, effects));
	if (text) examineText.value = text.showText;
}

function handleHotspotClick(hotspot: Hotspot) {
	if (!state.value) return;
	const branch = pickFirstMatch(hotspot.branches, state.value);
	if (!branch) return;
	runEffects(branch.effects);
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

	const text = payload.effects.find(
		(effect): effect is { showText: string } => "showText" in effect,
	);
	if (text) examineText.value = text.showText;

	if (payload.success) activeInteraction.value = null;
}

/**
 * Ferme toutes les boîtes ouvertes. Pour le dialogue, récupère d'abord son
 * état local (indices/flags gagnés en cours de route) avant de le fermer —
 * sinon une fermeture forcée (Échap, changement de scène) perdrait cette
 * progression, contrairement à un clic sur une option "fin".
 */
function closeOverlays() {
	if (activeDialogueId.value) {
		const finalState = dialogueOverlayRef.value?.localState;
		activeDialogueId.value = null;
		if (finalState) commitState(finalState);
	}
	activeInteraction.value = null;
	examineText.value = null;
	showResolution.value = false;
}

function handleSceneSelect(sceneId: string) {
	if (!state.value) return;
	closeOverlays();
	const next: PlayerState = { ...state.value, currentSceneId: sceneId };
	state.value = next;
	persistProgress(next);
}

// --- Outil de placement des hotspots (touche D) -----------------------------

const debugMode = ref(false);

function isTypingTarget(target: EventTarget | null) {
	return (
		target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
	);
}

function handleGlobalKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") {
		closeOverlays();
		return;
	}

	if (event.key.toLowerCase() === "d" && !isTypingTarget(event.target)) {
		debugMode.value = !debugMode.value;
	}
}

onMounted(() => window.addEventListener("keydown", handleGlobalKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleGlobalKeydown));

const showResolution = ref(false);
</script>

<template>
	<main class="flex h-screen w-screen items-center justify-center p-6 md:p-10">
		<p
			v-if="caseLoading || progressLoading || !scene || !state || !caseFile"
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

			<SceneSwitcher
				:scenes="caseFile.content.scenes"
				:state="state"
				@select="handleSceneSelect"
			/>

			<button
				v-if="resolutionUnlocked"
				type="button"
				class="absolute top-3 right-3 z-10 cursor-pointer border border-accent bg-accent px-3.5 py-2 font-mono text-label tracking-mono-wide text-accent-contrast"
				@click="showResolution = true"
			>
				RÉSOUDRE
			</button>

			<div
				class="pointer-events-none absolute right-3 bottom-3 z-10 font-mono text-micro text-content-ghost"
			>
				D = debug hotspots ({{ debugMode ? "ON" : "off" }})
			</div>

			<div class="absolute bottom-3 left-3 z-10 flex flex-col gap-2">
				<div
					v-for="toast in toasts"
					:key="toast.id"
					class="max-w-100 border border-accent bg-surface-raised px-3.5 py-2.5 text-body-sm text-content shadow-frame"
				>
					{{ toast.text }}
				</div>
			</div>

			<ExamineOverlay
				v-if="examineText"
				:text="examineText"
				@close="examineText = null"
			/>

			<DialogueOverlay
				v-if="activeDialogue"
				ref="dialogueOverlayRef"
				:dialogue="activeDialogue"
				:state="state"
				:character="activeCharacter"
				@close="handleDialogueClose"
			/>

			<InteractionOverlay
				v-if="activeInteraction"
				:interaction="activeInteraction"
				@resolve="handleInteractionResolve"
				@cancel="activeInteraction = null"
			/>

			<ResolutionModal
				v-if="showResolution"
				:slug="slug"
				:intro="caseFile.content.resolution.intro"
				:questions="caseFile.content.resolution.questions"
				@close="showResolution = false"
			/>

			<HotspotDebugOverlay v-if="debugMode" />
		</div>
	</main>
</template>
