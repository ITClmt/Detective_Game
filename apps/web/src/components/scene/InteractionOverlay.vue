<script setup lang="ts">
import type { Effect, Interaction } from "@repo/shared/schemas/effect.schema";
import { computed, ref } from "vue";

const props = defineProps<{
	interaction: Interaction;
}>();

const emit = defineEmits<{
	resolve: [payload: { success: boolean; effects: Effect[] }];
	cancel: [];
}>();

const value = ref("");
const inputType = computed(() =>
	props.interaction.params.kind === "number" ? "number" : "text",
);

function submit() {
	// v-model sur un <input type="number"> renvoie un nombre, pas une chaîne —
	// String(...) évite que "1403" (number) !== "1403" (string, dans le JSON).
	const success = String(value.value) === props.interaction.params.answer;

	emit("resolve", {
		success,
		effects: success
			? props.interaction.onSuccess
			: (props.interaction.onFailure ?? []),
	});

	if (success) value.value = "";
}
</script>

<template>
	<div
		class="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-6"
	>
		<form
			class="relative flex w-full max-w-100 flex-col gap-3.5 border border-border bg-surface-raised p-5 shadow-frame"
			@submit.prevent="submit"
		>
			<button
				type="button"
				aria-label="Fermer"
				class="absolute top-2 right-2 cursor-pointer font-mono text-content-faint transition-colors duration-150 hover:text-accent"
				@click="emit('cancel')"
			>
				✕
			</button>

			<p class="pr-4 text-body-sm text-content-lede">
				{{ interaction.prompt }}
			</p>

			<input
				v-model="value"
				:type="inputType"
				class="border border-border bg-surface-inset px-3 py-2 font-mono text-body text-content outline-none focus-visible:border-accent"
			>

			<button
				type="submit"
				class="cursor-pointer border border-accent bg-accent px-4 py-2 font-sans font-semibold text-ui text-accent-contrast transition-colors duration-150 hover:border-accent-hover hover:bg-accent-hover"
			>
				VALIDER
			</button>
		</form>
	</div>
</template>
