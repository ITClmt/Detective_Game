<script setup lang="ts">
import { filterAllMatches } from "@repo/shared";
import type { PlayerState } from "@repo/shared/game/state";
import type {
	CaseCharacter,
	Dialogue,
	DialogueOption,
} from "@repo/shared/schemas/case.schema";
import { computed, onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{
	dialogue: Dialogue;
	character?: CaseCharacter;
	state: PlayerState;
}>();

const emit = defineEmits<{
	close: [];
}>();

const currentNodeId = ref(props.dialogue.start);

const node = computed(() => props.dialogue.nodes[currentNodeId.value]);

const options = computed(() =>
	node.value ? filterAllMatches(node.value.options, props.state) : [],
);

function selectOption(option: DialogueOption) {
	if ("end" in option) {
		emit("close");
		return;
	}

	currentNodeId.value = option.goto;
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") emit("close");
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
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
					@click="emit('close')"
				>
					✕
				</button>
			</div>

			<p class="whitespace-pre-line text-body text-content">
				&gt; {{ node?.text }}
			</p>

			<div
				class="mt-3 flex flex-col divide-y divide-border-subtle border-t border-border"
			>
				<button
					v-for="(option, index) in options"
					:key="index"
					type="button"
					class="cursor-pointer px-4 py-3 text-left text-body-sm text-content-lede transition-colors duration-150 hover:bg-surface-inset"
					@click="selectOption(option)"
				>
					&gt; {{ option.text }}
				</button>
			</div>
		</div>
	</div>
</template>
