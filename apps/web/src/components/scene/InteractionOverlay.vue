<script setup lang="ts">
import type { Effect, Interaction } from "@repo/shared/schemas/effect.schema";
import { ref } from "vue";
import SceneModal from "@/components/scene/SceneModal.vue";

const props = defineProps<{
	interaction: Interaction;
}>();

const emit = defineEmits<{
	resolve: [payload: { success: boolean; effects: Effect[] }];
	cancel: [];
}>();

const value = ref("");

function submit() {
	const success = value.value === props.interaction.params.answer;

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
	<SceneModal label="SAISIE" @close="emit('cancel')">
		<form class="flex flex-col gap-3.5" @submit.prevent="submit">
			<p class="text-body-sm text-content-lede">{{ interaction.prompt }}</p>

			<input
				v-model="value"
				type="text"
				class="border border-border bg-surface-inset px-3 py-2 font-mono text-body text-content outline-none focus-visible:border-accent"
			>

			<button
				type="submit"
				class="cursor-pointer border border-accent bg-accent px-4 py-2 font-sans font-semibold text-ui text-accent-contrast transition-colors duration-150 hover:border-accent-hover hover:bg-accent-hover"
			>
				VALIDER
			</button>
		</form>
	</SceneModal>
</template>
