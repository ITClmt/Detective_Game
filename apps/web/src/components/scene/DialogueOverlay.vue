<script setup lang="ts">
import {
	applyEffects,
	filterAllMatches,
	hasSeenNode,
	markNodeSeen,
} from "@repo/shared/game/engine";
import type { PlayerState } from "@repo/shared/game/state";
import type { CaseCharacter, Dialogue } from "@repo/shared/schemas/case.schema";
import { computed, ref } from "vue";

const props = defineProps<{
	dialogue: Dialogue;
	state: PlayerState;
	character?: CaseCharacter;
}>();

const emit = defineEmits<{
	close: [state: PlayerState];
}>();

const currentNodeId = ref(props.dialogue.start);
const localState = ref(enterNode(props.state, props.dialogue.start));

/** Applique les effets du nœud et le marque comme vu, sans muter l'état reçu. */
function enterNode(state: PlayerState, nodeId: string): PlayerState {
	const node = props.dialogue.nodes[nodeId];
	const afterEffects = applyEffects(state, node?.effects ?? []);
	return markNodeSeen(afterEffects, props.dialogue.characterId, nodeId);
}

const node = computed(() => props.dialogue.nodes[currentNodeId.value]);
const options = computed(() =>
	node.value ? filterAllMatches(node.value.options, localState.value) : [],
);

function isOptionSeen(goto: string) {
	return hasSeenNode(localState.value, props.dialogue.characterId, goto);
}

function selectOption(option: (typeof options.value)[number]) {
	if ("end" in option) {
		emit("close", localState.value);
		return;
	}

	currentNodeId.value = option.goto;
	localState.value = enterNode(localState.value, option.goto);
}

// Permet à SceneView de récupérer l'état accumulé (indices, flags gagnés en
// cours de route) quand la fermeture vient d'ailleurs qu'un clic ici même —
// Échap, changement de scène — sans perdre la progression de la conversation.
defineExpose({ localState });
</script>

<template>
	<div
		class="absolute inset-x-8 bottom-7 z-20 flex flex-col border border-border backdrop-blur-[2px]"
		style="background: rgb(12 17 23 / 96%)"
	>
		<img
			v-if="character?.portrait"
			:src="character.portrait"
			alt=""
			class="pointer-events-none absolute right-6 bottom-full h-56 w-auto object-contain object-bottom"
		>

		<div class="px-6 py-5">
			<div class="mb-2.5 flex items-center justify-between">
				<p class="font-mono text-label tracking-mono-wide text-accent">
					{{ character?.name ?? dialogue.characterId }}
				</p>
				<button
					type="button"
					aria-label="Fermer"
					class="cursor-pointer font-mono text-content-faint transition-colors duration-150 hover:text-accent"
					@click="emit('close', localState)"
				>
					✕
				</button>
			</div>

			<p class="whitespace-pre-line text-body text-content">
				&gt; {{ node?.text }}
			</p>
		</div>

		<div
			class="flex flex-col divide-y divide-border-subtle border-t border-border"
		>
			<button
				v-for="(option, index) in options"
				:key="index"
				type="button"
				class="cursor-pointer px-6 py-3 text-left text-body-sm transition-colors duration-150 hover:bg-surface-inset"
				:class="
					!('end' in option) && isOptionSeen(option.goto)
						? 'text-content-faint'
						: 'text-content-lede'
				"
				@click="selectOption(option)"
			>
				&gt; {{ option.text }}
			</button>
		</div>
	</div>
</template>
